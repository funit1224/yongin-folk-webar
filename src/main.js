import "./styles.css";
import { getMapByScene, DEFAULT_SCENE, validateMapConfig } from "./config/maps.js";
import { getScene, listScenes } from "./config/scenes.js";
import { loadSceneAssets, updateSceneAssets } from "./content/glb-content.js";
import { createMultisetAR, isMultisetWebARSupported } from "./core/multiset-ar.js";
import { addTargetAssetLighting } from "./core/lighting.js";
import { createScene3D } from "./core/scene3d.js";
import { formatError, getDom, populateSceneSelect, setStatus } from "./ui/dom.js";

const clientId = import.meta.env.VITE_MULTISET_CLIENT_ID;
const clientSecret = import.meta.env.VITE_MULTISET_CLIENT_SECRET;
const shouldAutoBootWebAR =
  document.body.dataset.autoBootWebar === "true";

const elements = getDom();
let currentSceneId = new URLSearchParams(location.search).get("scene") || DEFAULT_SCENE;
let scene3d;
let multisetAR;
let anchors = [];
let setupRun = 0;
let autoStartTried = false;
let waitingForUserStart = false;
let arSessionStarted = false;
let retryAvailable = false;
let initialized = false;
let pendingStart = false;

// URL의 scene 파라미터 또는 기본 scene을 기준으로 드롭다운을 초기화합니다.
populateSceneSelect(elements.sceneSelect, listScenes(), currentSceneId);

elements.sceneSelect.addEventListener("change", () => {
  currentSceneId = elements.sceneSelect.value;
  void setup(currentSceneId);
});

elements.startButton.addEventListener("click", () => {
  if (retryAvailable && arSessionStarted) {
    void retryLocalization();
    return;
  }

  void startARSession();
});

elements.overlay.addEventListener("click", () => {
  if (!waitingForUserStart) return;
  waitingForUserStart = false;
  void startARSession();
});

elements.stopButton.addEventListener("click", () => {
  multisetAR?.stop();
  elements.stopButton.disabled = true;
});

if (document.body.dataset.autoBootWebar === "true") {
  void initializeWebARApp();
}

export async function initializeWebARApp() {
  if (initialized) return;
  initialized = true;

  // Multiset 인증 정보가 없으면 WebAR 초기화를 진행하지 않습니다.
  if (!clientId || !clientSecret) {
    setStatus(elements, "error", "환경변수 필요", ".env에 Multiset Client ID와 Secret을 입력해주세요.");
    return;
  }

  // Android Chrome / ARCore WebXR 지원 여부를 SDK 기준으로 확인합니다.
  const supported = await isMultisetWebARSupported();
  if (!supported) {
    setStatus(elements, "error", "WebXR 미지원", "ARCore 지원 Android Chrome에서 실행해주세요.");
    return;
  }

  await setup(currentSceneId);
}

export function requestARStart() {
  pendingStart = true;
  waitingForUserStart = true;
  if (multisetAR) {
    void startARSession({ fallbackToButton: true });
  }
}

async function setup(sceneId) {
  const runId = ++setupRun;
  const sceneConfig = getScene(sceneId);
  const mapConfig = getMapByScene(sceneConfig.mapId);

  elements.startButton.disabled = true;
  elements.stopButton.disabled = true;
  setStatus(elements, "pending", "공간 스캔을 준비하고 있어요", `${mapConfig.label} 공간 데이터를 불러오는 중입니다.`);
  elements.overlay.classList.remove("is-localized");

  cleanup();
  scene3d = createScene3D(document.body);
  // preview에서 확정한 장면 전체 보정값을 실제 AR에도 동일하게 적용합니다.
  scene3d.root.position.fromArray(sceneConfig.placementOffset || [0, 0, 0]);

  try {
    validateMapConfig(mapConfig);
    anchors = await loadSceneAssets(scene3d.root, sceneConfig.assets);
    addTargetAssetLighting(scene3d.root, anchors);
    if (runId !== setupRun) return;

    multisetAR = await createMultisetAR({
      clientId,
      clientSecret,
      mapCode: mapConfig.code,
      overlayRoot: elements.overlay,
      renderer: scene3d.renderer,
      scene: scene3d.scene,
      camera: scene3d.camera,
      contentRoot: scene3d.root,
      onStatus: (state, title, detail) => setStatus(elements, state, title, detail),
      onFrame: (deltaSeconds) => updateSceneAssets(anchors, deltaSeconds),
      onLocalized: () => {
        // 위치 인식 성공 후에만 콘텐츠 root를 표시합니다.
        scene3d.root.visible = true;
        elements.overlay.classList.add("is-localized");
        setStatus(elements, "success", "AR 콘텐츠 표시 중", "");
      },
      onLocalizationFailure: (reason) => {
        showRetryStatus(reason);
      },
      onError: (error) => {
        if (isRecoverableLocalizationError(error)) {
          showRetryStatus(error);
          return;
        }

        setStatus(elements, "error", "Multiset 오류", formatError(error));
      },
    });

    if (runId !== setupRun) return;
    multisetAR.connectMapSpace(scene3d.mapSpace);
    setStatus(elements, "ready", "주변을 천천히 비춰주세요", "휴대폰을 좌우로 천천히 움직여\n전시 안내판과 주변을 함께 담아주세요.");
    elements.startButton.disabled = false;
    waitingForUserStart = true;
    if (
      pendingStart ||
      (shouldAutoBootWebAR && !autoStartTried)
    ) {
      pendingStart = false;
      autoStartTried = true;
      void startARSession({ fallbackToButton: true });
    }
  } catch (error) {
    setStatus(elements, "error", "초기화 실패", formatError(error));
  }
}

async function startARSession({ fallbackToButton = false } = {}) {
  if (!multisetAR) return;

  elements.startButton.disabled = true;
  elements.stopButton.disabled = false;
  elements.startButton.textContent = "공간 스캔 중";
  setStatus(elements, "running", "AR 세션 시작 중", "카메라 권한을 허용해주세요.");

  try {
    await multisetAR.start();
    arSessionStarted = true;
    retryAvailable = false;
    waitingForUserStart = false;
    void retryLocalization();
  } catch (error) {
    if (isRecoverableLocalizationError(error)) {
      arSessionStarted = multisetAR.isActive();
      showRetryStatus(error);
      return;
    }

    elements.startButton.disabled = false;
    elements.startButton.textContent = "다시 시도";
    elements.stopButton.disabled = true;
    waitingForUserStart = fallbackToButton;
    setStatus(
      elements,
      fallbackToButton ? "ready" : "error",
      fallbackToButton ? "주변을 천천히 비춰주세요" : "AR 시작 실패",
      fallbackToButton
        ? "화면을 한 번 터치하면\n공간 스캔을 이어서 시작합니다."
        : formatError(error),
    );
  }
}

async function retryLocalization() {
  if (!multisetAR) return;

  retryAvailable = false;
  elements.startButton.disabled = true;
  elements.startButton.textContent = "공간 스캔 중";
  setStatus(elements, "running", "주변을 천천히 비춰주세요", "휴대폰을 좌우로 천천히 움직여\n전시 안내판과 주변을 함께 담아주세요.");

  try {
    const result = await multisetAR.localizeFrame();
    if (!result) {
      showRetryStatus();
    }
  } catch (error) {
    showRetryStatus(error);
  }
}

function showRetryStatus(error) {
  retryAvailable = true;
  waitingForUserStart = false;
  elements.startButton.disabled = false;
  elements.startButton.textContent = "다시 시도";
  elements.stopButton.disabled = false;
  setStatus(
    elements,
    "retry",
    "공간 인식이 어려워요",
    "주변을 천천히 다시 비춘 뒤\n아래 버튼을 눌러 재시도해주세요.",
  );
}

function isRecoverableLocalizationError(error) {
  const message = formatError(error).toLowerCase();
  return (
    message.includes("pose") ||
    message.includes("localiz") ||
    message.includes("confidence") ||
    message.includes("attempt")
  );
}

function cleanup() {
  // scene을 바꿀 때 이전 WebXR/Three.js 리소스를 정리합니다.
  multisetAR?.dispose();
  scene3d?.dispose();
  multisetAR = undefined;
  scene3d = undefined;
  anchors = [];
  autoStartTried = false;
  waitingForUserStart = false;
  arSessionStarted = false;
  retryAvailable = false;
}


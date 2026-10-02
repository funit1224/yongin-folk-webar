import "./styles.css";
import {
  getMapByScene,
  DEFAULT_SCENE,
  validateMapConfig,
} from "./config/maps.js";
import {
  BUTTON_LABELS,
  STATUS_MESSAGES,
} from "./config/messages.js";
import {
  getScene,
  listScenes,
} from "./config/scenes.js";
import {
  loadSceneAssets,
  updateSceneAssets,
} from "./content/glb-content.js";
import {
  createMultisetAR,
  isMultisetWebARSupported,
} from "./core/multiset-ar.js";
import { addTargetAssetLighting } from "./core/lighting.js";
import { createScene3D } from "./core/scene3d.js";
import {
  formatError,
  getDom,
  populateSceneSelect,
  setStatus,
} from "./ui/dom.js";

const clientId = import.meta.env
  .VITE_MULTISET_CLIENT_ID;
const clientSecret = import.meta.env
  .VITE_MULTISET_CLIENT_SECRET;
const shouldAutoBootWebAR =
  document.body.dataset.autoBootWebar === "true";
const LOCALIZATION_CAPTURE_DELAY_MS = 2500;

const elements = getDom();
let currentSceneId =
  new URLSearchParams(location.search).get(
    "scene",
  ) || DEFAULT_SCENE;
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
let localizationRun = 0;

// URL의 scene 파라미터 또는 기본 scene을 기준으로 드롭다운을 초기화합니다.
populateSceneSelect(
  elements.sceneSelect,
  listScenes(),
  currentSceneId,
);

elements.sceneSelect.addEventListener(
  "change",
  () => {
    currentSceneId = elements.sceneSelect.value;
    void setup(currentSceneId);
  },
);

elements.startButton.addEventListener(
  "click",
  () => {
    if (retryAvailable && arSessionStarted) {
      void retryLocalization();
      return;
    }

    void startARSession();
  },
);

elements.overlay.addEventListener("click", () => {
  if (!waitingForUserStart) return;
  waitingForUserStart = false;
  void startARSession();
});

elements.stopButton.addEventListener(
  "click",
  () => {
    multisetAR?.stop();
  },
);

if (
  document.body.dataset.autoBootWebar === "true"
) {
  void initializeWebARApp();
}

export async function initializeWebARApp() {
  if (initialized) return;
  initialized = true;

  // Multiset 인증 정보가 없으면 WebAR 초기화를 진행하지 않습니다.
  if (!clientId || !clientSecret) {
    setStatus(
      elements,
      "error",
      STATUS_MESSAGES.missingEnv.title,
      STATUS_MESSAGES.missingEnv.detail,
    );
    return;
  }

  // Android Chrome / ARCore WebXR 지원 여부를 SDK 기준으로 확인합니다.
  const supported =
    await isMultisetWebARSupported();
  if (!supported) {
    setStatus(
      elements,
      "error",
      STATUS_MESSAGES.unsupportedWebXR.title,
      STATUS_MESSAGES.unsupportedWebXR.detail,
    );
    return;
  }

  await setup(currentSceneId);
}

export function requestARStart() {
  pendingStart = true;
  waitingForUserStart = true;
  if (multisetAR) {
    void startARSession({
      fallbackToButton: true,
    });
  }
}

async function setup(sceneId) {
  const runId = ++setupRun;
  const sceneConfig = getScene(sceneId);
  const mapConfig = getMapByScene(
    sceneConfig.mapId,
  );

  elements.startButton.disabled = true;
  elements.stopButton.disabled = true;
  const preparingMapMessage =
    STATUS_MESSAGES.preparingMap(mapConfig.label);
  setStatus(
    elements,
    "pending",
    preparingMapMessage.title,
    preparingMapMessage.detail,
  );
  elements.overlay.classList.remove(
    "is-localized",
  );

  cleanup();
  scene3d = createScene3D(document.body);
  // preview에서 확정한 장면 전체 보정값을 실제 AR에도 동일하게 적용합니다.
  scene3d.root.position.fromArray(
    sceneConfig.placementOffset || [0, 0, 0],
  );

  try {
    validateMapConfig(mapConfig);
    anchors = await loadSceneAssets(
      scene3d.root,
      sceneConfig.assets,
    );
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
      onStatus: (state, title, detail) =>
        setStatus(elements, state, title, detail),
      onFrame: (deltaSeconds) =>
        updateSceneAssets(anchors, deltaSeconds),
      onLocalized: () => {
        // 위치 인식 성공 후에만 콘텐츠 root를 표시합니다.
        scene3d.root.visible = true;
        elements.overlay.classList.add(
          "is-localized",
        );
        setStatus(
          elements,
          "success",
          STATUS_MESSAGES.localized.title,
          STATUS_MESSAGES.localized.detail,
        );
      },
      onLocalizationFailure: (reason) => {
        showRetryStatus(reason);
      },
      onSessionEnd: () => {
        resetARSessionState();
      },
      onError: (error) => {
        if (
          isRecoverableLocalizationError(error)
        ) {
          showRetryStatus(error);
          return;
        }

        setStatus(
          elements,
          "error",
          STATUS_MESSAGES.multisetError.title,
          formatError(error),
        );
      },
    });

    if (runId !== setupRun) return;
    multisetAR.connectMapSpace(scene3d.mapSpace);
    setStatus(
      elements,
      "ready",
      STATUS_MESSAGES.scanReady.title,
      STATUS_MESSAGES.scanReady.detail,
    );
    elements.startButton.disabled = false;
    waitingForUserStart = true;
    if (
      pendingStart ||
      (shouldAutoBootWebAR && !autoStartTried)
    ) {
      pendingStart = false;
      autoStartTried = true;
      void startARSession({
        fallbackToButton: true,
      });
    }
  } catch (error) {
    setStatus(
      elements,
      "error",
      STATUS_MESSAGES.initFailed.title,
      formatError(error),
    );
  }
}

async function startARSession({
  fallbackToButton = false,
} = {}) {
  if (!multisetAR) return;

  resetLocalizationView();
  elements.startButton.disabled = true;
  elements.stopButton.disabled = false;
  elements.startButton.textContent =
    BUTTON_LABELS.scanning;
  setStatus(
    elements,
    "running",
    STATUS_MESSAGES.sessionStarting.title,
    STATUS_MESSAGES.sessionStarting.detail,
  );

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
    elements.startButton.textContent =
      BUTTON_LABELS.retry;
    elements.stopButton.disabled = true;
    waitingForUserStart = fallbackToButton;
    setStatus(
      elements,
      fallbackToButton ? "ready" : "error",
      fallbackToButton
        ? STATUS_MESSAGES.startFallback.title
        : STATUS_MESSAGES.arStartFailed.title,
      fallbackToButton
        ? STATUS_MESSAGES.startFallback.detail
        : formatError(error),
    );
  }
}

async function retryLocalization() {
  if (!multisetAR) return;

  const runId = ++localizationRun;
  retryAvailable = false;
  elements.startButton.disabled = true;
  elements.startButton.textContent =
    BUTTON_LABELS.scanning;
  setStatus(
    elements,
    "running",
    STATUS_MESSAGES.scanReady.title,
    STATUS_MESSAGES.scanReady.detail,
  );

  try {
    await sleep(LOCALIZATION_CAPTURE_DELAY_MS);
    if (
      runId !== localizationRun ||
      !multisetAR
    ) {
      return;
    }

    const result =
      await multisetAR.localizeFrame();
    if (runId !== localizationRun) return;

    if (!result) {
      showRetryStatus();
    }
  } catch (error) {
    if (runId !== localizationRun) return;
    showRetryStatus(error);
  }
}

function showRetryStatus(error) {
  retryAvailable = true;
  waitingForUserStart = false;
  elements.startButton.disabled = false;
  elements.startButton.textContent =
    BUTTON_LABELS.retry;
  elements.stopButton.disabled = false;
  setStatus(
    elements,
    "retry",
    STATUS_MESSAGES.retry.title,
    STATUS_MESSAGES.retry.detail,
  );
}

function resetLocalizationView() {
  localizationRun += 1;
  retryAvailable = false;
  elements.overlay.classList.remove(
    "is-localized",
  );

  if (scene3d?.root) {
    scene3d.root.visible = false;
  }
}

function resetARSessionState() {
  resetLocalizationView();
  arSessionStarted = false;
  waitingForUserStart = false;
  elements.startButton.disabled = false;
  elements.startButton.textContent =
    BUTTON_LABELS.scanIdle;
  elements.stopButton.disabled = true;
  setStatus(
    elements,
    "ready",
    STATUS_MESSAGES.scanReady.title,
    STATUS_MESSAGES.scanReady.detail,
  );
}

function isRecoverableLocalizationError(error) {
  const message =
    formatError(error).toLowerCase();
  return (
    message.includes("pose") ||
    message.includes("localiz") ||
    message.includes("confidence") ||
    message.includes("attempt")
  );
}

function cleanup() {
  // scene을 바꿀 때 이전 WebXR/Three.js 리소스를 정리합니다.
  localizationRun += 1;
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

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

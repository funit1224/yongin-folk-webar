import "./styles.css";
import {
  getMapByScene,
  DEFAULT_SCENE,
  validateMapConfig,
} from "./config/maps.js";
import { STATUS_MESSAGES } from "./config/messages.js";
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
import { createARSessionFlow } from "./webar/ar-session-flow.js";

const clientId = import.meta.env
  .VITE_MULTISET_CLIENT_ID;
const clientSecret = import.meta.env
  .VITE_MULTISET_CLIENT_SECRET;
const shouldAutoBootWebAR =
  document.body.dataset.autoBootWebar === "true";

const elements = getDom();
const arSessionFlow = createARSessionFlow({
  elements,
  setStatus,
});
let currentSceneId =
  new URLSearchParams(location.search).get(
    "scene",
  ) || DEFAULT_SCENE;
let scene3d;
let multisetAR;
let anchors = [];
let setupRun = 0;
let autoStartTried = false;
let initialized = false;
let pendingStart = false;

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
    arSessionFlow.handleStartButton();
  },
);

elements.overlay.addEventListener("click", () => {
  arSessionFlow.handleOverlayTap();
});

elements.stopButton.addEventListener(
  "click",
  () => {
    arSessionFlow.stop();
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
  arSessionFlow.requestStart();
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
        arSessionFlow.handleLocalized();
      },
      onLocalizationFailure: (reason) => {
        arSessionFlow.showRetryStatus(reason);
      },
      onSessionEnd: () => {
        arSessionFlow.resetARSessionState();
      },
      onError: (error) => {
        if (
          arSessionFlow.isRecoverableLocalizationError(
            error,
          )
        ) {
          arSessionFlow.showRetryStatus(error);
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
    arSessionFlow.bindRuntime({
      multisetAR,
      scene3d,
    });
    multisetAR.connectMapSpace(scene3d.mapSpace);
    setStatus(
      elements,
      "ready",
      STATUS_MESSAGES.scanReady.title,
      STATUS_MESSAGES.scanReady.detail,
    );
    elements.startButton.disabled = false;
    arSessionFlow.setWaitingForUserStart(true);
    if (
      pendingStart ||
      (shouldAutoBootWebAR && !autoStartTried)
    ) {
      pendingStart = false;
      autoStartTried = true;
      void arSessionFlow.startARSession({
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

function cleanup() {
  // scene을 바꿀 때 이전 WebXR/Three.js 리소스를 정리합니다.
  multisetAR?.dispose();
  scene3d?.dispose();
  multisetAR = undefined;
  scene3d = undefined;
  anchors = [];
  autoStartTried = false;
  arSessionFlow.resetForSetup();
}

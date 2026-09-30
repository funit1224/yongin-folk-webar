import "./styles.css";
import { getMapByScene, DEFAULT_SCENE, validateMapConfig } from "./config/maps.js";
import { getScene, listScenes } from "./config/scenes.js";
import { loadSceneAssets, updateSceneAssets } from "./content/glb-content.js";
import { createMultisetAR, isMultisetWebARSupported } from "./core/multiset-ar.js";
import { createScene3D } from "./core/scene3d.js";
import { formatError, getDom, populateSceneSelect, setStatus } from "./ui/dom.js";

const clientId = import.meta.env.VITE_MULTISET_CLIENT_ID;
const clientSecret = import.meta.env.VITE_MULTISET_CLIENT_SECRET;

const elements = getDom();
let currentSceneId = new URLSearchParams(location.search).get("scene") || DEFAULT_SCENE;
let scene3d;
let multisetAR;
let anchors = [];
let setupRun = 0;

populateSceneSelect(elements.sceneSelect, listScenes(), currentSceneId);

elements.sceneSelect.addEventListener("change", () => {
  currentSceneId = elements.sceneSelect.value;
  void setup(currentSceneId);
});

elements.startButton.addEventListener("click", () => {
  if (!multisetAR) return;

  elements.startButton.disabled = true;
  elements.stopButton.disabled = false;
  setStatus(elements, "running", "AR 세션 시작 중", "카메라 권한을 허용해주세요.");

  multisetAR.start().catch((error) => {
    setStatus(elements, "error", "AR 시작 실패", formatError(error));
    elements.startButton.disabled = false;
    elements.stopButton.disabled = true;
  });
});

elements.stopButton.addEventListener("click", () => {
  multisetAR?.stop();
  elements.stopButton.disabled = true;
});

void boot();

async function boot() {
  if (!clientId || !clientSecret) {
    setStatus(elements, "error", "환경변수 필요", ".env에 Multiset Client ID와 Secret을 입력해주세요.");
    return;
  }

  const supported = await isMultisetWebARSupported();
  if (!supported) {
    setStatus(elements, "error", "WebXR 미지원", "ARCore 지원 Android Chrome에서 실행해주세요.");
    return;
  }

  await setup(currentSceneId);
}

async function setup(sceneId) {
  const runId = ++setupRun;
  const sceneConfig = getScene(sceneId);
  const mapConfig = getMapByScene(sceneConfig.mapId);

  elements.startButton.disabled = true;
  elements.stopButton.disabled = true;
  setStatus(elements, "pending", "준비 중", `${mapConfig.label} 공간을 준비하고 있습니다.`);

  cleanup();
  scene3d = createScene3D(document.body);
  scene3d.root.position.fromArray(sceneConfig.placementOffset || [0, 0, 0]);

  try {
    validateMapConfig(mapConfig);
    anchors = await loadSceneAssets(scene3d.root, sceneConfig.assets);
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
        attachContentToMapGroup();
        scene3d.root.visible = true;
        setStatus(elements, "success", "AR 콘텐츠 표시 중", "");
      },
    });

    if (runId !== setupRun) return;
    attachContentToMapGroup();
    setStatus(elements, "ready", "준비 완료", `${mapConfig.label} 공간으로 AR을 시작할 수 있습니다.`);
    elements.startButton.disabled = false;
  } catch (error) {
    setStatus(elements, "error", "초기화 실패", formatError(error));
  }
}

function attachContentToMapGroup() {
  const mapGroup = multisetAR?.getMapGroup();
  if (!mapGroup || !scene3d?.root) return;
  if (scene3d.root.parent !== mapGroup) {
    mapGroup.add(scene3d.root);
  }
}

function cleanup() {
  multisetAR?.dispose();
  scene3d?.dispose();
  multisetAR = undefined;
  scene3d = undefined;
  anchors = [];
}


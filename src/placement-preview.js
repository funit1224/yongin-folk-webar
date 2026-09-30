import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "./preview.css";
import { DEFAULT_SCENE } from "./config/maps.js";
import {
  getScene,
  listScenes,
} from "./config/scenes.js";
import {
  loadSceneAssets,
  updateSceneAssets,
} from "./content/glb-content.js";

const select = document.querySelector(
  "#preview-scene-select",
);
const status = document.querySelector(
  "#preview-status",
);
const stage = document.querySelector(
  "#preview-stage",
);
const offsetInputs = {
  x: document.querySelector("#offset-x"),
  y: document.querySelector("#offset-y"),
  z: document.querySelector("#offset-z"),
};
const offsetOutput = document.querySelector(
  "#offset-output",
);

let renderer;
let scene;
let camera;
let controls;
let root;
let mapRoot;
let grid;
let anchors = [];
let previewRun = 0;
const clock = new THREE.Clock();
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
loader.setDRACOLoader(dracoLoader);

populateSelect();
init();
void loadPreview(select.value);

select.addEventListener("change", () => {
  void loadPreview(select.value);
});

for (const input of Object.values(offsetInputs)) {
  input.addEventListener(
    "input",
    applyPlacementOffsetFromInputs,
  );
}

function populateSelect() {
  for (const item of listScenes()) {
    const option =
      document.createElement("option");
    option.value = item.id;
    option.textContent = item.label;
    option.selected = item.id === DEFAULT_SCENE;
    select.appendChild(option);
  }
}

function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.5),
  );
  renderer.setSize(
    stage.clientWidth,
    stage.clientHeight,
  );
  stage.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf7f4ef);

  camera = new THREE.PerspectiveCamera(
    55,
    stage.clientWidth / stage.clientHeight,
    0.01,
    100,
  );
  camera.position.set(4.8, 3.2, 5.2);

  controls = new OrbitControls(
    camera,
    renderer.domElement,
  );
  controls.target.set(0, 0.45, 0);
  controls.update();

  root = new THREE.Group();
  mapRoot = new THREE.Group();
  mapRoot.name = "PreviewMapMesh";
  scene.add(mapRoot);
  scene.add(root);
  grid = new THREE.GridHelper(
    60,
    120,
    0x9ca3af,
    0xd6d3d1,
  );
  scene.add(grid);
  scene.add(new THREE.AxesHelper(1.2));
  scene.add(
    new THREE.HemisphereLight(
      0xffffff,
      0x334155,
      2,
    ),
  );

  const light = new THREE.DirectionalLight(
    0xffffff,
    2,
  );
  light.position.set(2, 4, 3);
  scene.add(light);

  window.addEventListener("resize", resize);
  renderer.setAnimationLoop(render);
}

async function loadPreview(sceneId) {
  const runId = ++previewRun;
  const sceneConfig = getScene(sceneId);
  mapRoot.clear();
  root.clear();
  anchors = [];
  setOffsetInputs(
    sceneConfig.placementOffset || [0, 0, 0],
  );
  applyPlacementOffsetFromInputs();
  status.textContent = `${sceneConfig.label} 모델을 먼저 불러오는 중입니다.`;

  try {
    anchors = await loadSceneAssets(
      root,
      sceneConfig.assets,
    );
    if (runId !== previewRun) return;
    root.visible = true;
    status.textContent = `${sceneConfig.label} 모델 표시 완료. 공간 mesh를 불러오는 중입니다.`;
  } catch (error) {
    if (runId !== previewRun) return;
    status.textContent = `모델 로드 실패: ${formatError(error)}`;
    return;
  }

  try {
    await loadPreviewMesh(
      sceneConfig,
      (progress) => {
        if (runId !== previewRun) return;
        status.textContent = `${sceneConfig.label} 공간 mesh 로딩 중 ${progress}`;
      },
    );
    if (runId !== previewRun) return;
    status.textContent = `${sceneConfig.label} 실제 mesh 좌표계에서 배치를 확인 중입니다.`;
  } catch (error) {
    if (runId !== previewRun) return;
    status.textContent = `공간 mesh 로드 실패. 모델만 표시 중입니다. ${formatError(error)}`;
  }
}

async function loadPreviewMesh(
  sceneConfig,
  onProgress,
) {
  if (!sceneConfig.previewMeshPath) return;

  const gltf = await loadGltfWithProgress(
    sceneConfig.previewMeshPath,
    onProgress,
  );
  const mesh = gltf.scene;
  mesh.name = `${sceneConfig.label} Mesh`;
  const wireframeRoot = new THREE.Group();
  wireframeRoot.name = `${sceneConfig.label} Mesh Wireframe`;

  mesh.traverse((object) => {
    if (!object.isMesh) return;
    object.frustumCulled = false;
    object.material = new THREE.MeshBasicMaterial(
      {
        color: 0x8f8577,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      },
    );

    const wireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(
        object.geometry,
      ),
      new THREE.LineBasicMaterial({
        color: 0x2563eb,
        transparent: true,
        opacity: 0.18,
        depthTest: false,
      }),
    );
    object.updateMatrixWorld(true);
    object.localToWorld(wireframe.position);
    wireframe.matrix.copy(object.matrixWorld);
    wireframe.matrixAutoUpdate = false;
    wireframeRoot.add(wireframe);
  });
  mapRoot.add(mesh);
  mapRoot.add(wireframeRoot);
  const boxHelper = new THREE.BoxHelper(
    mesh,
    0xdc2626,
  );
  boxHelper.name = `${sceneConfig.label} Mesh Bounds`;
  mapRoot.add(boxHelper);
  frameObject(mapRoot);
}

function loadGltfWithProgress(path, onProgress) {
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      resolve,
      (event) => {
        if (!event.total) {
          onProgress?.("");
          return;
        }
        const percent = Math.round(
          (event.loaded / event.total) * 100,
        );
        onProgress?.(`${percent}%`);
      },
      reject,
    );
  });
}

function formatError(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  return error.message || String(error);
}

function frameObject(object) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(
    object,
  );
  if (box.isEmpty()) return;

  const center = box.getCenter(
    new THREE.Vector3(),
  );
  const size = box.getSize(new THREE.Vector3());
  const maxSize = Math.max(
    size.x,
    size.y,
    size.z,
    1,
  );

  controls.target.copy(center);
  camera.position.set(
    center.x + maxSize * 0.55,
    center.y + maxSize * 0.32,
    center.z + maxSize * 0.55,
  );
  camera.near = 0.01;
  camera.far = Math.max(100, maxSize * 4);
  camera.updateProjectionMatrix();
  controls.update();
}

function render() {
  const deltaSeconds = clock.getDelta();
  updateSceneAssets(anchors, deltaSeconds);
  controls.update();
  renderer.render(scene, camera);
}

function resize() {
  camera.aspect =
    stage.clientWidth / stage.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(
    stage.clientWidth,
    stage.clientHeight,
  );
}

function setOffsetInputs(offset) {
  offsetInputs.x.value = formatNumber(
    offset[0] || 0,
  );
  offsetInputs.y.value = formatNumber(
    offset[1] || 0,
  );
  offsetInputs.z.value = formatNumber(
    offset[2] || 0,
  );
}

function applyPlacementOffsetFromInputs() {
  const offset = [
    readInputNumber(offsetInputs.x),
    readInputNumber(offsetInputs.y),
    readInputNumber(offsetInputs.z),
  ];
  root.position.fromArray(offset);
  offsetOutput.textContent = `placementOffset: [${offset.map(formatNumber).join(", ")}]`;
}

function readInputNumber(input) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : 0;
}

function formatNumber(value) {
  return Number(value.toFixed(2)).toString();
}

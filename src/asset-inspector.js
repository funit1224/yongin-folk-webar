import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SCENES } from "./config/scenes.js";
import {
  loadSceneAssets,
  updateSceneAssets,
} from "./content/glb-content.js";
import "./preview.css";

const stage = document.querySelector("#asset-stage");
const select = document.querySelector("#asset-select");
const status = document.querySelector("#asset-status");
const assets = SCENES.Test03.assets;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(stage.clientWidth, stage.clientHeight);
renderer.setClearColor(0xf7f4ef, 1);
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  stage.clientWidth / stage.clientHeight,
  0.01,
  100,
);
camera.position.set(0, 1.5, 5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2));

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(2, 4, 3);
scene.add(directionalLight);

const grid = new THREE.GridHelper(8, 16, 0x94a3b8, 0xd6d3d1);
scene.add(grid);
scene.add(new THREE.AxesHelper(1.8));

const modelRoot = new THREE.Group();
scene.add(modelRoot);
let activeAnchors = [];

for (const [index, asset] of assets.entries()) {
  const option = document.createElement("option");
  option.value = String(index);
  option.textContent = `${index + 1}. ${asset.name}`;
  select.appendChild(option);
}

select.value = "1";
void loadAsset(Number(select.value));

select.addEventListener("change", () => {
  void loadAsset(Number(select.value));
});

for (const button of document.querySelectorAll("[data-view]")) {
  button.addEventListener("click", () => {
    setCameraView(button.dataset.view);
  });
}

window.addEventListener("resize", resize);

function resize() {
  camera.aspect = stage.clientWidth / stage.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(stage.clientWidth, stage.clientHeight);
}

async function loadAsset(index) {
  const asset = assets[index];
  status.textContent = `${asset.name} 원본 방향을 불러오는 중입니다.`;

  try {
    activeAnchors = await loadSceneAssets(modelRoot, [
      {
        ...asset,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: 1,
        unlit: true,
      },
    ]);

    const model = activeAnchors[0].object;
    frameModel(model);
    status.textContent = `${asset.name} 원본 GLB 방향입니다. 배치 회전은 적용하지 않았습니다.`;
  } catch (error) {
    status.textContent = `에셋 로드 실패: ${error.message}`;
  }
}

function frameModel(model) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const distance = Math.max(size.x, size.y, size.z) * 2.2 || 4;

  controls.target.copy(center);
  camera.position.set(center.x, center.y + size.y * 0.4, center.z + distance);
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 20;
  camera.updateProjectionMatrix();
  controls.update();
}

function setCameraView(view) {
  const box = new THREE.Box3().setFromObject(modelRoot);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const distance = Math.max(size.x, size.y, size.z) * 2.4 || 4;
  const y = center.y + size.y * 0.35;

  const positions = {
    "+z": [center.x, y, center.z + distance],
    "-z": [center.x, y, center.z - distance],
    "+x": [center.x + distance, y, center.z],
    "-x": [center.x - distance, y, center.z],
  };

  camera.position.fromArray(positions[view]);
  controls.target.copy(center);
  controls.update();
}

function animate() {
  updateSceneAssets(activeAnchors, 1 / 60);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

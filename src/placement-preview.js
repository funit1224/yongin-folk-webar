import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./preview.css";
import { DEFAULT_SCENE } from "./config/maps.js";
import { getScene, listScenes } from "./config/scenes.js";
import { loadSceneAssets, updateSceneAssets } from "./content/glb-content.js";

const select = document.querySelector("#preview-scene-select");
const status = document.querySelector("#preview-status");
const stage = document.querySelector("#preview-stage");

let renderer;
let scene;
let camera;
let controls;
let root;
let anchors = [];
const clock = new THREE.Clock();

populateSelect();
init();
void loadPreview(select.value);

select.addEventListener("change", () => {
  void loadPreview(select.value);
});

function populateSelect() {
  for (const item of listScenes()) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.label;
    option.selected = item.id === DEFAULT_SCENE;
    select.appendChild(option);
  }
}

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  stage.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf7f4ef);

  camera = new THREE.PerspectiveCamera(55, stage.clientWidth / stage.clientHeight, 0.01, 100);
  camera.position.set(2.8, 1.8, 3.2);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.55, -0.6);
  controls.update();

  root = new THREE.Group();
  scene.add(root);
  scene.add(new THREE.GridHelper(6, 24, 0x9ca3af, 0xd6d3d1));
  scene.add(new THREE.AxesHelper(1.2));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2));

  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(2, 4, 3);
  scene.add(light);

  window.addEventListener("resize", resize);
  renderer.setAnimationLoop(render);
}

async function loadPreview(sceneId) {
  const sceneConfig = getScene(sceneId);
  status.textContent = `${sceneConfig.label} 모델을 불러오는 중입니다.`;
  anchors = await loadSceneAssets(root, sceneConfig.assets);
  root.visible = true;
  status.textContent = `${sceneConfig.label} 배치를 확인 중입니다.`;
}

function render() {
  const deltaSeconds = clock.getDelta();
  updateSceneAssets(anchors, deltaSeconds);
  controls.update();
  renderer.render(scene, camera);
}

function resize() {
  camera.aspect = stage.clientWidth / stage.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(stage.clientWidth, stage.clientHeight);
}


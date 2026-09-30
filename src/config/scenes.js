const MODEL_BASE = "/assets/models/glb";

// Multiset Test03 map 좌표 기준 마당 배치입니다.
// 중심 [-1.2, -1.05, -9.35], 반경 약 2m의 원형 배치입니다.
// 스캔 mesh 기준 원점 y=0이 실제 바닥과 맞지 않아, 전시물 전체를 바닥 쪽으로 낮췄습니다.
const commonAssets = [
  {
    name: "망치모루",
    path: `${MODEL_BASE}/1_망치모루.glb`,
    position: [-1.2, -1.05, -11.35],
    rotation: [0, 0, 0],
    scale: 0.45,
    unlit: true,
    playAnimation: true,
  },
  {
    name: "침선장",
    path: `${MODEL_BASE}/2_침선장.glb`,
    position: [0.1, -1.05, -10.9],
    rotation: [0, -0.7, 0],
    scale: 0.42,
    unlit: true,
    playAnimation: true,
  },
  {
    name: "한옥",
    path: `${MODEL_BASE}/3_한옥.glb`,
    position: [0.75, -1.05, -9.7],
    rotation: [0, -1.4, 0],
    scale: 0.48,
    unlit: true,
    playAnimation: true,
  },
  {
    name: "볏단낫",
    path: `${MODEL_BASE}/4_볏단낫.glb`,
    position: [0.55, -1.05, -8.35],
    rotation: [0, -2.1, 0],
    scale: 0.45,
    unlit: true,
    playAnimation: true,
  },
  {
    name: "육모방망이",
    path: `${MODEL_BASE}/5_육모방망이.glb`,
    position: [-0.5, -1.05, -7.45],
    rotation: [0, -2.8, 0],
    scale: 0.48,
    unlit: true,
    playAnimation: true,
  },
  {
    name: "저울엽전",
    path: `${MODEL_BASE}/6_저울엽전.glb`,
    position: [-1.9, -1.05, -7.45],
    rotation: [0, 2.8, 0],
    scale: 0.42,
    unlit: true,
    playAnimation: true,
  },
  {
    name: "만두",
    path: `${MODEL_BASE}/7_만두.glb`,
    position: [-2.95, -1.05, -8.35],
    rotation: [0, 2.1, 0],
    scale: 0.5,
    unlit: true,
    playAnimation: true,
  },
  {
    name: "약탕기",
    path: `${MODEL_BASE}/8_약탕기.glb`,
    position: [-3.15, -1.05, -9.7],
    rotation: [0, 1.4, 0],
    scale: 0.5,
    unlit: true,
    playAnimation: true,
  },
  {
    name: "물레옹기",
    path: `${MODEL_BASE}/9_물레옹기.glb`,
    position: [-2.5, -1.05, -10.9],
    rotation: [0, 0.7, 0],
    scale: 0.48,
    unlit: true,
    playAnimation: true,
  },
];

export const SCENES = {
  Test01: {
    label: "Test01 - 좌표 보정 필요",
    mapId: "Test01",
    previewMeshPath: "/assets/maps/Test01/textured_mesh.glb",
    placementOffset: [0, 0, 0],
    assets: commonAssets,
  },
  Test02: {
    label: "Test02 - 좌표 보정 필요",
    mapId: "Test02",
    previewMeshPath: "/assets/maps/Test02/textured_mesh.glb",
    placementOffset: [0, 0, 0],
    assets: commonAssets,
  },
  Test03: {
    label: "Test03 - 기준",
    mapId: "Test03",
    previewMeshPath: "/assets/maps/Test03/textured_mesh.glb",
    placementOffset: [4, 0, 3],
    assets: commonAssets,
  },
};

export function getScene(sceneId) {
  return SCENES[sceneId] || SCENES.Test01;
}

export function listScenes() {
  return Object.entries(SCENES).map(([id, scene]) => ({
    id,
    label: scene.label,
  }));
}


const MODEL_BASE = "/assets/models/glb";

const commonAssets = [
  {
    name: "망치모루",
    path: `${MODEL_BASE}/1_망치모루.glb`,
    position: [-0.9, 0, -0.7],
    rotation: [0, 0.35, 0],
    scale: 0.45,
    unlit: true,
    playAnimation: true,
  },
  {
    name: "침선장",
    path: `${MODEL_BASE}/2_침선장.glb`,
    position: [0, 0, -1],
    rotation: [0, 0, 0],
    scale: 0.42,
    unlit: true,
    playAnimation: true,
  },
  {
    name: "한옥",
    path: `${MODEL_BASE}/3_한옥.glb`,
    position: [0.85, 0, -0.8],
    rotation: [0, -0.35, 0],
    scale: 0.48,
    unlit: true,
    playAnimation: true,
  },
];

export const SCENES = {
  Test01: {
    label: "Test01",
    mapId: "Test01",
    assets: commonAssets,
  },
  Test02: {
    label: "Test02",
    mapId: "Test02",
    assets: commonAssets,
  },
  Test03: {
    label: "Test03",
    mapId: "Test03",
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


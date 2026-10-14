import {
  commonAssets,
  makeLookAtCenterRotation,
} from "./asset-layout.js";

export { makeLookAtCenterRotation };

export const SCENES = {
  Test01: {
    label: "Test01 - 좌표 보정 필요",
    mapId: "Test01",
    previewMeshPath:
      "/assets/maps/Test01/textured_mesh.glb",
    placementOffset: [0, 0, 0],
    assets: commonAssets,
  },
  Test02: {
    label: "Test02 - 좌표 보정 필요",
    mapId: "Test02",
    previewMeshPath:
      "/assets/maps/Test02/textured_mesh.glb",
    placementOffset: [0, 0, 0],
    assets: commonAssets,
  },
  Test03: {
    label: "Test03 - 기준",
    mapId: "Test03",
    previewMeshPath:
      "/assets/maps/Test03/textured_mesh.glb",
    placementOffset: [4, 0, 3],
    assets: commonAssets,
  },
  Test04: {
    label: "Test04 - 테스트용",
    mapId: "Test04",
    previewMeshPath:
      "/assets/maps/Test04/textured_mesh.glb",
    placementOffset: [0, -0.4, 8],
    assets: commonAssets,
  },
};

// 알 수 없는 sceneId가 들어오면 Test03로 fallback합니다.
export function getScene(sceneId) {
  return SCENES[sceneId] || SCENES.Test03;
}

// UI 드롭다운에서 사용할 scene 목록입니다.
export function listScenes() {
  return Object.entries(SCENES).map(
    ([id, scene]) => ({
      id,
      label: scene.label,
    }),
  );
}

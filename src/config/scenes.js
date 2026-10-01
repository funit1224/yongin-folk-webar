const MODEL_BASE = "/assets/models/glb";
// 9개 전시물을 배치할 원의 중심 좌표입니다. [x 좌우, y 높이, z 앞뒤]
const PLACEMENT_CENTER = [-1.2, -1.05, -9.35];
// 9개 전시물 사이 간격을 조절하는 원 반경입니다.
const PLACEMENT_RADIUS = 3.5;
// 각 에셋에 공통으로 적용되는 기본 렌더링 설정입니다.
const DEFAULT_ASSET_SETTINGS = {
  // 1이면 GLB 원본 크기 그대로 사용합니다.
  scale: 1,
  // false면 GLB 제공자가 만든 원본 재질과 조명 반응을 유지합니다.
  unlit: false,
  // true면 GLB 내부 애니메이션이 있을 때 자동 재생합니다.
  playAnimation: true,
};

// Multiset Test03 map 좌표 기준 마당 배치입니다.
// 중심과 반경을 바꾸면 9개 전시물이 같은 간격의 원형으로 다시 배치됩니다.
// 스캔 mesh 기준 원점 y=0이 실제 바닥과 맞지 않아, 전시물 전체를 바닥 쪽으로 낮췄습니다.
// 각 position은 [x, y, z]이며, scale 1은 GLB 원본 크기입니다.
// placementOffset은 장면 전체를 한 번 더 이동합니다.
const makeCirclePosition = (index) => {
  const [centerX, centerY, centerZ] =
    PLACEMENT_CENTER;
  const angle =
    -Math.PI / 2 + (index * Math.PI * 2) / 9;

  return [
    centerX + Math.cos(angle) * PLACEMENT_RADIUS,
    centerY,
    centerZ + Math.sin(angle) * PLACEMENT_RADIUS,
  ];
};

const makeCircleRotation = (
  index,
  rotationOffset = 0,
) => {
  const angle =
    -Math.PI / 2 + (index * Math.PI * 2) / 9;

  // 각 전시물이 원 바깥쪽이 아니라 중심 쪽을 바라보게 맞춥니다.
  return [
    0,
    -angle - Math.PI / 2 + rotationOffset,
    0,
  ];
};

const commonAssets = [
  {
    name: "망치모루",
    path: `${MODEL_BASE}/1_망치모루.glb`,
  },
  {
    name: "침선장",
    path: `${MODEL_BASE}/2_침선장.glb`,
  },
  {
    name: "한옥",
    path: `${MODEL_BASE}/3_한옥.glb`,
  },
  {
    name: "볏단낫",
    path: `${MODEL_BASE}/4_볏단낫.glb`,
  },
  {
    name: "육모방망이",
    path: `${MODEL_BASE}/5_육모방망이.glb`,
  },
  {
    name: "저울엽전",
    path: `${MODEL_BASE}/6_저울엽전.glb`,
    rotationOffset: -Math.PI / 2,
  },
  {
    name: "만두",
    path: `${MODEL_BASE}/7_만두.glb`,
  },
  {
    name: "약탕기",
    path: `${MODEL_BASE}/8_약탕기.glb`,
  },
  {
    name: "물레옹기",
    path: `${MODEL_BASE}/9_물레옹기.glb`,
  },
].map((asset, index) => ({
  ...DEFAULT_ASSET_SETTINGS,
  ...asset,
  position: makeCirclePosition(index),
  rotation: makeCircleRotation(
    index,
    asset.rotationOffset,
  ),
}));

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

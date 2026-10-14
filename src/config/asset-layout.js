const MODEL_BASE = "/assets/models/glb";

// 9개 전시물이 바라볼 기준점입니다. [x 좌우, y 높이, z 앞뒤]
export const PLACEMENT_CENTER = [
  -1.2, -1.05, -9.35,
];

// 각 에셋에 공통으로 적용되는 기본 렌더링 설정입니다.
const DEFAULT_ASSET_SETTINGS = {
  // 1이면 GLB 원본 크기 그대로 사용합니다.
  scale: 0.93,
  // false면 GLB 제공자가 만든 원본 재질과 조명 반응을 유지합니다.
  unlit: false,
  // true면 GLB 내부 애니메이션이 있을 때 자동 재생합니다.
  playAnimation: true,
};

// Multiset Test03 map 좌표 기준 마당 배치입니다.
// 현장 수정 요청에 맞춰 원형 배치 대신 마당에 흩어진 수동 좌표를 사용합니다.
// 각 position은 [x, y, z]이며, scale 1은 GLB 원본 크기입니다.
const ASSET_PLACEMENTS = [
  [0, -1.05, -13],
  [-3.2, -1.05, -12.4],
  [2.2, -1.05, -10.5],
  [2.1, -1.05, -6.4],
  [-2.5, -1.05, -7],
  [-1, -1.05, -5],
  [-0.4, -1.05, -8.3],
  [-4, -1.05, -9.8],
  [-1, -1.05, -11],
];

const degreesToRadians = (degrees) =>
  (degrees * Math.PI) / 180;

// 자동으로 중심을 바라본 뒤, 에셋별로 추가 보정할 Y축 회전값입니다.
const ASSET_ROTATION_OFFSETS = [
  degreesToRadians(30),
  degreesToRadians(45),
  0,
  degreesToRadians(60),
  degreesToRadians(60),
  degreesToRadians(10),
  degreesToRadians(82),
  degreesToRadians(50),
  degreesToRadians(80),
];

export const makeLookAtCenterRotation = (
  position,
  rotationOffset = 0,
) => {
  const [centerX, , centerZ] = PLACEMENT_CENTER;
  const [x, , z] = position;
  const angle = Math.atan2(
    z - centerZ,
    x - centerX,
  );

  // 각 전시물이 원 바깥쪽이 아니라 중심 쪽을 바라보게 맞춥니다.
  return [
    0,
    -angle - Math.PI / 2 + rotationOffset,
    0,
  ];
};

export const commonAssets = [
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
  rotationOffset: ASSET_ROTATION_OFFSETS[index],
  position: ASSET_PLACEMENTS[index],
  rotation: makeLookAtCenterRotation(
    ASSET_PLACEMENTS[index],
    ASSET_ROTATION_OFFSETS[index],
  ),
}));

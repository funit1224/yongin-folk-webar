import * as THREE from "three";

export const LIGHTING_CONFIG = {
  // PointLight/SpotLight를 특정 에셋 근처에 붙여서 비교할 때 사용하는 타겟입니다.
  // 다른 에셋에 조명을 얹고 싶으면 name을 commonAssets의 name 값으로 바꿉니다.
  targetAsset: {
    name: "저울엽전",
  },
  // AmbientLight는 장면 전체를 방향 없이 균일하게 밝힙니다.
  // 어두운 부분을 끌어올리기 좋지만, 너무 강하면 모델 입체감이 줄어듭니다.
  ambient: {
    enabled: false,
    color: 0xffffff,
    intensity: 1,
  },
  // HemisphereLight는 장면 전체를 은은하게 밝히는 기본 환경광입니다.
  // skyColor는 위쪽 빛 색, groundColor는 아래쪽에서 올라오는 빛 색입니다.
  hemisphere: {
    enabled: true,
    skyColor: 0xffffff,
    groundColor: 0x334155,
    // 값이 클수록 전체 모델이 더 밝아집니다.
    intensity: 3.2,
  },
  // DirectionalLight는 햇빛처럼 한 방향에서 들어오는 조명입니다.
  // 모델의 입체감과 명암을 만드는 데 가장 크게 영향을 줍니다.
  directional: {
    enabled: true,
    color: 0xffffff,
    // 값이 클수록 빛을 받는 면이 더 밝아집니다.
    intensity: 3,
    // [x, y, z] 방향에서 조명이 들어옵니다. y가 높을수록 위에서 비추는 느낌입니다.
    position: [0.5, 1, 0.35],
  },
  // 보조 DirectionalLight입니다. 한쪽 면만 너무 어두울 때 반대쪽을 채우는 용도입니다.
  fillDirectional: {
    enabled: false,
    color: 0xffffff,
    intensity: 1.5,
    position: [-0.5, 0.8, -0.35],
  },
  // PointLight는 전구처럼 특정 위치에서 사방으로 퍼지는 빛입니다.
  // 특정 전시물 근처만 밝히고 싶을 때 켭니다.
  point: {
    enabled: true,
    color: 0xffffff,
    intensity: 2,
    distance: 8,
    // 타겟 에셋 위치에서 [x, y, z]만큼 떨어진 곳에 조명을 둡니다.
    positionOffset: [0, 2, 0],
  },
  // SpotLight는 무대 조명처럼 특정 방향으로 원뿔 형태의 빛을 쏩니다.
  // 특정 오브젝트를 강조하는 연출용으로 사용합니다.
  spot: {
    enabled: true,
    color: 0xffffff,
    intensity: 3,
    distance: 10,
    angle: Math.PI / 6,
    penumbra: 0.4,
    // 타겟 에셋보다 위/앞쪽에서 비춥니다.
    positionOffset: [0, 4, 3],
    // 타겟 에셋 위치에서 어느 지점을 바라볼지 정합니다.
    targetOffset: [0, 0, 0],
  },
  // RectAreaLight는 큰 사각형 면에서 부드럽게 나오는 빛입니다.
  // MeshStandardMaterial/PhysicalMaterial 계열에서 의미가 있고, 모바일 성능 확인이 필요합니다.
  rectArea: {
    enabled: false,
    color: 0xffffff,
    intensity: 3,
    width: 5,
    height: 5,
    position: [0, 3, 2],
    lookAt: [0, 0, 0],
  },
  // LightProbe는 여러 방향의 환경광 정보를 이용하는 고급 환경광입니다.
  // 실제 AR 환경광처럼 자연스럽게 섞고 싶을 때 검토합니다.
  lightProbe: {
    enabled: false,
    intensity: 1,
  },
};

export function addSceneLighting(scene) {
  const lights = {};

  if (LIGHTING_CONFIG.ambient.enabled) {
    lights.ambient = new THREE.AmbientLight(
      LIGHTING_CONFIG.ambient.color,
      LIGHTING_CONFIG.ambient.intensity,
    );
    scene.add(lights.ambient);
  }

  if (LIGHTING_CONFIG.hemisphere.enabled) {
    lights.hemisphere = new THREE.HemisphereLight(
      LIGHTING_CONFIG.hemisphere.skyColor,
      LIGHTING_CONFIG.hemisphere.groundColor,
      LIGHTING_CONFIG.hemisphere.intensity,
    );
    scene.add(lights.hemisphere);
  }

  if (LIGHTING_CONFIG.directional.enabled) {
    lights.directional =
      new THREE.DirectionalLight(
        LIGHTING_CONFIG.directional.color,
        LIGHTING_CONFIG.directional.intensity,
      );
    lights.directional.position.fromArray(
      LIGHTING_CONFIG.directional.position,
    );
    scene.add(lights.directional);
  }

  if (LIGHTING_CONFIG.fillDirectional.enabled) {
    lights.fillDirectional =
      new THREE.DirectionalLight(
        LIGHTING_CONFIG.fillDirectional.color,
        LIGHTING_CONFIG.fillDirectional.intensity,
      );
    lights.fillDirectional.position.fromArray(
      LIGHTING_CONFIG.fillDirectional.position,
    );
    scene.add(lights.fillDirectional);
  }

  if (LIGHTING_CONFIG.rectArea.enabled) {
    lights.rectArea = new THREE.RectAreaLight(
      LIGHTING_CONFIG.rectArea.color,
      LIGHTING_CONFIG.rectArea.intensity,
      LIGHTING_CONFIG.rectArea.width,
      LIGHTING_CONFIG.rectArea.height,
    );
    lights.rectArea.position.fromArray(
      LIGHTING_CONFIG.rectArea.position,
    );
    lights.rectArea.lookAt(
      ...LIGHTING_CONFIG.rectArea.lookAt,
    );
    scene.add(lights.rectArea);
  }

  if (LIGHTING_CONFIG.lightProbe.enabled) {
    lights.lightProbe = new THREE.LightProbe(
      undefined,
      LIGHTING_CONFIG.lightProbe.intensity,
    );
    scene.add(lights.lightProbe);
  }

  return lights;
}

export function addTargetAssetLighting(root, anchors) {
  const targetAnchor = anchors.find(
    (anchor) =>
      anchor.asset.name ===
      LIGHTING_CONFIG.targetAsset.name,
  );
  if (!targetAnchor) return {};

  const lights = {};
  const targetPosition = targetAnchor.object.position;

  if (LIGHTING_CONFIG.point.enabled) {
    lights.point = new THREE.PointLight(
      LIGHTING_CONFIG.point.color,
      LIGHTING_CONFIG.point.intensity,
      LIGHTING_CONFIG.point.distance,
    );
    lights.point.position
      .copy(targetPosition)
      .add(
        new THREE.Vector3().fromArray(
          LIGHTING_CONFIG.point.positionOffset,
        ),
      );
    root.add(lights.point);
  }

  if (LIGHTING_CONFIG.spot.enabled) {
    lights.spot = new THREE.SpotLight(
      LIGHTING_CONFIG.spot.color,
      LIGHTING_CONFIG.spot.intensity,
      LIGHTING_CONFIG.spot.distance,
      LIGHTING_CONFIG.spot.angle,
      LIGHTING_CONFIG.spot.penumbra,
    );
    lights.spot.position
      .copy(targetPosition)
      .add(
        new THREE.Vector3().fromArray(
          LIGHTING_CONFIG.spot.positionOffset,
        ),
      );
    lights.spot.target.position
      .copy(targetPosition)
      .add(
        new THREE.Vector3().fromArray(
          LIGHTING_CONFIG.spot.targetOffset,
        ),
      );
    root.add(lights.spot);
    root.add(lights.spot.target);
  }

  return lights;
}

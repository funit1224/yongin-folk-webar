import * as THREE from "three";

export const LIGHTING_CONFIG = {
  // HemisphereLight는 장면 전체를 은은하게 밝히는 기본 환경광입니다.
  // skyColor는 위쪽 빛 색, groundColor는 아래쪽에서 올라오는 빛 색입니다.
  hemisphere: {
    skyColor: 0xffffff,
    groundColor: 0x334155,
    // 값이 클수록 전체 모델이 더 밝아집니다.
    intensity: 3.2,
  },
  // DirectionalLight는 햇빛처럼 한 방향에서 들어오는 조명입니다.
  // 모델의 입체감과 명암을 만드는 데 가장 크게 영향을 줍니다.
  directional: {
    color: 0xffffff,
    // 값이 클수록 빛을 받는 면이 더 밝아집니다.
    intensity: 3,
    // [x, y, z] 방향에서 조명이 들어옵니다. y가 높을수록 위에서 비추는 느낌입니다.
    position: [0.5, 1, 0.35],
  },
};

export function addSceneLighting(scene) {
  const hemisphere = new THREE.HemisphereLight(
    LIGHTING_CONFIG.hemisphere.skyColor,
    LIGHTING_CONFIG.hemisphere.groundColor,
    LIGHTING_CONFIG.hemisphere.intensity,
  );
  scene.add(hemisphere);

  const directional = new THREE.DirectionalLight(
    LIGHTING_CONFIG.directional.color,
    LIGHTING_CONFIG.directional.intensity,
  );
  directional.position.fromArray(
    LIGHTING_CONFIG.directional.position,
  );
  scene.add(directional);

  return {
    hemisphere,
    directional,
  };
}

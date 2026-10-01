import * as THREE from "three";
import { MapSpace } from "@multisetai/vps/three";
import { addSceneLighting } from "./lighting.js";

export function createScene3D(
  container = document.body,
) {
  // WebXR 배경 카메라 위에 Three.js 콘텐츠를 투명하게 올립니다.
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.5),
  );
  renderer.setSize(
    window.innerWidth,
    window.innerHeight,
  );
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    100,
  );

  const mapRoot = new THREE.Group();
  mapRoot.name = "FolkVillageMapSpaceRoot";
  const mapSpace = new MapSpace(mapRoot, {
    hideUntilLocalized: true,
  });
  scene.add(mapSpace.object);

  const root = new THREE.Group();
  root.name = "FolkVillageContentRoot";
  // VPS 위치 인식 전에는 콘텐츠를 숨깁니다.
  root.visible = false;
  mapSpace.add(root);

  // GLB가 너무 어둡게 보이지 않도록 공통 조명을 둡니다.
  addSceneLighting(scene);

  const onResize = () => {
    camera.aspect =
      window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(
      window.innerWidth,
      window.innerHeight,
    );
  };
  window.addEventListener("resize", onResize);

  return {
    renderer,
    scene,
    camera,
    mapSpace,
    root,
    dispose() {
      window.removeEventListener(
        "resize",
        onResize,
      );
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

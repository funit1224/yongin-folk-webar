import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export async function loadSceneAssets(
  root,
  assets,
) {
  const loader = new GLTFLoader();
  root.clear();

  // scene 설정에 들어있는 GLB들을 root 아래 anchor로 로드합니다.
  const anchors = await Promise.all(
    assets.map(async (asset) => {
      const model = await loadAsset(
        loader,
        asset,
      );
      root.add(model);
      return {
        asset,
        object: model,
        mixer: model.userData.mixer,
      };
    }),
  );

  return anchors;
}

export function updateSceneAssets(
  anchors,
  deltaSeconds,
) {
  // GLB 내부 애니메이션이 있으면 매 프레임 재생합니다.
  for (const anchor of anchors) {
    anchor.mixer?.update(deltaSeconds);
  }
}

async function loadAsset(loader, asset) {
  const gltf = await loader.loadAsync(asset.path);
  const wrapper = new THREE.Group();
  // wrapper가 배치/회전/스케일을 담당하고, 원본 모델은 내부에 둡니다.
  wrapper.name = asset.name;
  wrapper.position.fromArray(asset.position);
  wrapper.rotation.set(...asset.rotation);
  wrapper.scale.setScalar(asset.scale);

  const model = gltf.scene;
  prepareModel(model, asset);
  alignModelToGround(model);
  wrapper.add(model);

  if (
    asset.playAnimation !== false &&
    gltf.animations.length
  ) {
    const mixer = new THREE.AnimationMixer(
      wrapper,
    );
    for (const clip of gltf.animations) {
      mixer.clipAction(clip).play();
    }
    wrapper.userData.mixer = mixer;
  }

  return wrapper;
}

function prepareModel(model, asset) {
  // 모바일 AR에서 잘 보이도록 재질과 컬링을 정리합니다.
  model.traverse((object) => {
    if (!object.isMesh) return;
    object.frustumCulled = false;

    if (asset.unlit) {
      applyUnlitMaterial(object);
      return;
    }

    tuneLitMaterial(object);
  });
}

function applyUnlitMaterial(object) {
  const sourceMaterial = Array.isArray(
    object.material,
  )
    ? object.material[0]
    : object.material;

  object.material = new THREE.MeshBasicMaterial({
    map: sourceMaterial?.map || null,
    color: sourceMaterial?.map
      ? 0xffffff
      : 0xdbeafe,
    side: THREE.DoubleSide,
  });
}

function tuneLitMaterial(object) {
  const materials = Array.isArray(object.material)
    ? object.material
    : [object.material];

  for (const material of materials) {
    if (!material) continue;
    material.side = THREE.DoubleSide;
    if ("emissive" in material) {
      material.emissive = new THREE.Color(
        0xffffff,
      );
      material.emissiveIntensity = 0.12;
    }
    material.needsUpdate = true;
  }
}

function alignModelToGround(model) {
  // GLB 원점이 달라도 모델 최하단이 anchor 높이에 오도록 보정합니다.
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(
    model,
  );
  if (Number.isFinite(box.min.y)) {
    model.position.y -= box.min.y;
  }
}

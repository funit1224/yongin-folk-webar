import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export async function loadSceneAssets(root, assets) {
  const loader = new GLTFLoader();
  root.clear();

  const anchors = await Promise.all(
    assets.map(async (asset) => {
      const model = await loadAsset(loader, asset);
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

export function updateSceneAssets(anchors, deltaSeconds) {
  for (const anchor of anchors) {
    anchor.mixer?.update(deltaSeconds);
  }
}

async function loadAsset(loader, asset) {
  const gltf = await loader.loadAsync(asset.path);
  const wrapper = new THREE.Group();
  wrapper.name = asset.name;
  wrapper.position.fromArray(asset.position);
  wrapper.rotation.set(...asset.rotation);
  wrapper.scale.setScalar(asset.scale);

  const model = gltf.scene;
  prepareModel(model, asset);
  alignModelToGround(model);
  wrapper.add(model);

  if (asset.playAnimation !== false && gltf.animations.length) {
    const mixer = new THREE.AnimationMixer(wrapper);
    for (const clip of gltf.animations) {
      mixer.clipAction(clip).play();
    }
    wrapper.userData.mixer = mixer;
  }

  return wrapper;
}

function prepareModel(model, asset) {
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
  const sourceMaterial = Array.isArray(object.material)
    ? object.material[0]
    : object.material;

  object.material = new THREE.MeshBasicMaterial({
    map: sourceMaterial?.map || null,
    color: sourceMaterial?.map ? 0xffffff : 0xdbeafe,
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
      material.emissive = new THREE.Color(0xffffff);
      material.emissiveIntensity = 0.12;
    }
    material.needsUpdate = true;
  }
}

function alignModelToGround(model) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  if (Number.isFinite(box.min.y)) {
    model.position.y -= box.min.y;
  }
}


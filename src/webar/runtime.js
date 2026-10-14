import { validateMapConfig } from "../config/maps.js";
import {
  loadSceneAssets,
  updateSceneAssets,
} from "../content/glb-content.js";
import { createMultisetAR } from "../core/multiset-ar.js";
import { addTargetAssetLighting } from "../core/lighting.js";
import { createScene3D } from "../core/scene3d.js";

export async function createSceneRuntime({
  container,
  sceneConfig,
}) {
  const scene3d = createScene3D(container);
  // preview에서 확정한 장면 전체 보정값을 실제 AR에도 동일하게 적용합니다.
  scene3d.root.position.fromArray(
    sceneConfig.placementOffset || [0, 0, 0],
  );

  let anchors;
  try {
    anchors = await loadSceneAssets(
      scene3d.root,
      sceneConfig.assets,
    );
    addTargetAssetLighting(scene3d.root, anchors);
  } catch (error) {
    scene3d.dispose();
    throw error;
  }

  return {
    scene3d,
    anchors,
  };
}

export async function createMultisetRuntime({
  clientId,
  clientSecret,
  mapConfig,
  elements,
  scene3d,
  anchors,
  handlers,
}) {
  validateMapConfig(mapConfig);

  return createMultisetAR({
    clientId,
    clientSecret,
    mapCode: mapConfig.code,
    overlayRoot: elements.overlay,
    renderer: scene3d.renderer,
    scene: scene3d.scene,
    camera: scene3d.camera,
    contentRoot: scene3d.root,
    onStatus: handlers.onStatus,
    onFrame: (deltaSeconds) =>
      updateSceneAssets(anchors, deltaSeconds),
    onLocalized: handlers.onLocalized,
    onLocalizationFailure:
      handlers.onLocalizationFailure,
    onSessionEnd: handlers.onSessionEnd,
    onError: handlers.onError,
  });
}

import * as THREE from "three";

export async function loadPreviewMesh({
  sceneConfig,
  loader,
  mapRoot,
  camera,
  controls,
  onProgress,
}) {
  if (!sceneConfig.previewMeshPath) return;

  // 실제 Multiset map 좌표계 확인용 textured mesh를 불러옵니다.
  const gltf = await loadGltfWithProgress(
    loader,
    sceneConfig.previewMeshPath,
    onProgress,
  );
  const mesh = gltf.scene;
  mesh.name = `${sceneConfig.label} Mesh`;
  const wireframeRoot = new THREE.Group();
  wireframeRoot.name = `${sceneConfig.label} Mesh Wireframe`;

  mesh.traverse((object) => {
    if (!object.isMesh) return;
    object.frustumCulled = false;
    // 위치 확인이 목적이라 원본 텍스처 대신 반투명 단색으로 표시합니다.
    object.material = new THREE.MeshBasicMaterial(
      {
        color: 0x8f8577,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      },
    );

    const wireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(
        object.geometry,
      ),
      new THREE.LineBasicMaterial({
        color: 0x2563eb,
        transparent: true,
        opacity: 0.18,
        depthTest: false,
      }),
    );
    object.updateMatrixWorld(true);
    object.localToWorld(wireframe.position);
    wireframe.matrix.copy(object.matrixWorld);
    wireframe.matrixAutoUpdate = false;
    wireframeRoot.add(wireframe);
  });
  mapRoot.add(mesh);
  mapRoot.add(wireframeRoot);
  const boxHelper = new THREE.BoxHelper(
    mesh,
    0xdc2626,
  );
  boxHelper.name = `${sceneConfig.label} Mesh Bounds`;
  mapRoot.add(boxHelper);
  frameObject(mapRoot, camera, controls);
}

function loadGltfWithProgress(
  loader,
  path,
  onProgress,
) {
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      resolve,
      (event) => {
        if (!event.total) {
          onProgress?.("");
          return;
        }
        const percent = Math.round(
          (event.loaded / event.total) * 100,
        );
        onProgress?.(`${percent}%`);
      },
      reject,
    );
  });
}

function frameObject(object, camera, controls) {
  // 큰 공간 mesh가 화면 밖에 있지 않도록 카메라를 자동 배치합니다.
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(
    object,
  );
  if (box.isEmpty()) return;

  const center = box.getCenter(
    new THREE.Vector3(),
  );
  const size = box.getSize(new THREE.Vector3());
  const maxSize = Math.max(
    size.x,
    size.y,
    size.z,
    1,
  );

  controls.target.copy(center);
  camera.position.set(
    center.x + maxSize * 0.55,
    center.y + maxSize * 0.32,
    center.z + maxSize * 0.55,
  );
  camera.near = 0.01;
  camera.far = Math.max(100, maxSize * 4);
  camera.updateProjectionMatrix();
  controls.update();
}

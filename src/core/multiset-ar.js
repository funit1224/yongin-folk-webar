import {
  MultisetClient,
  XRSessionManager,
} from "@multisetai/vps/core";
import { ThreeAdapter } from "@multisetai/vps/three";

export async function isMultisetWebARSupported() {
  return ThreeAdapter.isSupported();
}

// Multiset 인증, WebXR 세션, Three.js adapter를 한 번에 구성합니다.
export async function createMultisetAR({
  clientId,
  clientSecret,
  mapCode,
  overlayRoot,
  renderer,
  scene,
  camera,
  contentRoot,
  onStatus,
  onFrame,
  onLocalized,
}) {
  // 선택된 Map Code로 위치 인식 대상 지도를 지정합니다.
  const client = new MultisetClient({
    clientId,
    clientSecret,
    mapType: "map",
    code: mapCode,
  });

  await client.authorize();

  // SDK가 카메라 프레임을 기반으로 VPS 위치 인식을 수행합니다.
  const session = new XRSessionManager(renderer.getContext(), {
    client,
    overlayRoot,
    autoLocalize: true,
    relocalization: false,
    backgroundLocalization: false,
    confidenceCheck: true,
    confidenceThreshold: 0.75,
    poseTimeoutMs: 15000,
    framebufferScaleFactor: 1,
    onSessionStart: () => {
      onStatus("running", "위치 인식 중", "스캔된 장소를 천천히 비춰주세요.");
    },
    onSessionEnd: () => {
      onStatus("ready", "준비 완료", "다시 시작할 수 있습니다.");
    },
    onLocalizationResult: (result) => {
      const confidence = result?.localizeData?.confidence;
      const detail =
        typeof confidence === "number"
          ? `위치 인식 성공. 신뢰도 ${(confidence * 100).toFixed(0)}%.`
          : "위치 인식 성공.";
      onStatus("success", "위치 인식 성공", detail);
    },
    onLocalizationFailure: (reason) => {
      onStatus("running", "위치 인식 재시도 중", formatError(reason));
    },
    onError: (error) => {
      onStatus("error", "Multiset 오류", formatError(error));
    },
  });

  const adapter = new ThreeAdapter({
    session,
    renderer,
    scene,
    camera,
    showMesh: false,
    showGizmo: false,
    useDefaultButton: false,
    onXRFrame: (event) => {
      onFrame?.(event.deltaSeconds);
      // SDK 디버그 mesh/gizmo는 숨기고 커스텀 콘텐츠만 남깁니다.
      hideSdkDebugChildren(adapter, contentRoot);
    },
    onLocalizationSuccess: () => {
      onLocalized?.();
    },
  });

  adapter.initialize();

  return {
    client,
    session,
    adapter,
    getMapGroup() {
      return adapter?.world?.meshVisualizer?.getMeshGroup?.();
    },
    start() {
      return adapter.startSession();
    },
    stop() {
      adapter.stopSession();
    },
    dispose() {
      adapter.dispose();
      session.dispose();
    },
  };
}

function hideSdkDebugChildren(adapter, contentRoot) {
  const mapGroup = adapter?.world?.meshVisualizer?.getMeshGroup?.();
  if (!mapGroup) return;

  for (const child of mapGroup.children) {
    if (child !== contentRoot) {
      child.visible = false;
    }
  }
}

function formatError(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  return error.message || String(error);
}


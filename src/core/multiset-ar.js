import {
  MultisetClient,
  XRSessionManager,
} from "@multisetai/vps/core";
import { ThreeAdapter } from "@multisetai/vps/three";
import { STATUS_MESSAGES } from "../config/messages.js";

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
  onLocalizationFailure,
  onError,
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
  const session = new XRSessionManager(
    renderer.getContext(),
    {
      client,
      overlayRoot,
      autoLocalize: false,
      relocalization: false,
      backgroundLocalization: false,
      confidenceCheck: true,
      confidenceThreshold: 0.75,
      poseTimeoutMs: 15000,
      framebufferScaleFactor: 1,
      onSessionStart: () => {
        onStatus(
          "running",
          STATUS_MESSAGES.scanReady.title,
          STATUS_MESSAGES.scanReady.detail,
        );
      },
      onSessionEnd: () => {},
      onLocalizationResult: (result) => {
        const confidence =
          result?.localizeData?.confidence;
        const scanCompleteMessage =
          STATUS_MESSAGES.scanComplete(confidence);
        onStatus(
          "success",
          scanCompleteMessage.title,
          scanCompleteMessage.detail,
        );
      },
      onLocalizationFailure: (reason) => {
        onLocalizationFailure?.(reason);
      },
      onError: (error) => {
        onError?.(error);
      },
    },
  );

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
    connectMapSpace(mapSpace) {
      mapSpace.connect(adapter);
    },
    start() {
      return adapter.startSession();
    },
    isActive() {
      return (
        adapter.isActive?.() ??
        session.isActive?.() ??
        false
      );
    },
    localizeFrame() {
      return adapter.localizeFrame();
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

function hideSdkDebugChildren(
  adapter,
  contentRoot,
) {
  const mapGroup =
    adapter?.world?.meshVisualizer?.getMeshGroup?.();
  if (!mapGroup) return;

  for (const child of mapGroup.children) {
    if (
      child !== contentRoot &&
      child !== contentRoot.parent
    ) {
      child.visible = false;
    }
  }
}


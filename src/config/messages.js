export const BUTTON_LABELS = {
  scanIdle: "공간 스캔 시작",
  scanning: "공간 스캔 중",
  retry: "다시 시도",
};

export const STATUS_MESSAGES = {
  missingEnv: {
    title: "환경변수 필요",
    detail:
      ".env에 Multiset Client ID와 Secret을 입력해주세요.",
  },
  unsupportedWebXR: {
    title: "WebXR 미지원",
    detail:
      "ARCore 지원 Android Chrome에서 실행해주세요.",
  },
  preparingMap(mapLabel) {
    return {
      title: "공간 스캔을 준비하고 있어요",
      detail: `${mapLabel} 공간 데이터를 불러오는 중입니다.`,
    };
  },
  scanReady: {
    title: "주변을 천천히 비춰주세요",
    detail:
      "휴대폰을 좌우로 천천히 움직여\n주변을 함께 담아주세요.",
  },
  sessionStarting: {
    title: "AR 세션 시작 중",
    detail: "카메라 권한을 허용해주세요.",
  },
  localized: {
    title: "AR 콘텐츠 표시 중",
    detail: "",
  },
  scanComplete(confidence) {
    return {
      title: "공간 스캔 완료",
      detail:
        typeof confidence === "number"
          ? `위치 인식 성공. 신뢰도 ${(confidence * 100).toFixed(0)}%.`
          : "위치 인식 성공.",
    };
  },
  startFallback: {
    title: "주변을 천천히 비춰주세요",
    detail:
      "화면을 한 번 터치하면\n공간 스캔을 이어서 시작합니다.",
  },
  arStartFailed: {
    title: "AR 시작 실패",
  },
  retry: {
    title: "공간 인식이 어려워요",
    detail:
      "주변을 천천히 다시 비춘 뒤\n아래 버튼을 눌러 재시도해주세요.",
  },
  initFailed: {
    title: "초기화 실패",
  },
  multisetError: {
    title: "Multiset 오류",
  },
};

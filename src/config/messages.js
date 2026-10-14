export const BUTTON_LABELS = {
  scanIdle: "공간 스캔 시작",
  scanning: "공간 스캔 중",
  retry: "다시 시도",
};

const EXPERIENCE_GUIDE =
  "휴대폰을 움직여\n오늘 체험한 내용들을 살펴 보세요.";

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
    title: "AR 콘텐츠 안내",
    detail: EXPERIENCE_GUIDE,
  },
  sessionStarting: {
    title: "AR 세션 시작 중",
    detail: "카메라 권한을 허용해주세요.",
  },
  localized: {
    title: "AR 콘텐츠 표시 중",
    detail: EXPERIENCE_GUIDE,
  },
  scanComplete(confidence) {
    return {
      title: "공간 스캔 완료",
      detail: EXPERIENCE_GUIDE,
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
    title: "공간 인식 재시도",
    detail: EXPERIENCE_GUIDE,
  },
  initFailed: {
    title: "초기화 실패",
  },
  multisetError: {
    title: "Multiset 오류",
  },
};

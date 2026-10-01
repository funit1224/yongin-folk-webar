// Multiset Map Code는 공개 저장소에 남기지 않기 위해 환경변수에서 읽습니다.
export const MAPS = {
  Test01: {
    label: "Test01",
    code: import.meta.env.VITE_MULTISET_MAP_TEST01,
    note: "같은 장소 후보 1",
  },
  Test02: {
    label: "Test02",
    code: import.meta.env.VITE_MULTISET_MAP_TEST02,
    note: "같은 장소 후보 2",
  },
  Test03: {
    label: "Test03",
    code: import.meta.env.VITE_MULTISET_MAP_TEST03,
    note: "같은 장소 후보 3",
  },
  Test04: {
    label: "Test04",
    code: import.meta.env.VITE_MULTISET_MAP_TEST04,
    note: "테스트용 Map",
  },
};

export const DEFAULT_SCENE =
  import.meta.env.VITE_DEFAULT_SCENE || "Test03";

// scene 설정의 mapId를 실제 Multiset map 설정으로 변환합니다.
export function getMapByScene(sceneId) {
  return MAPS[sceneId] || MAPS[DEFAULT_SCENE] || Object.values(MAPS)[0];
}

// Map Code가 빠진 상태에서 AR 세션을 시작하지 않도록 초기에 막습니다.
export function validateMapConfig(mapConfig) {
  if (!mapConfig?.code) {
    throw new Error(`${mapConfig?.label || "선택된 공간"}의 Map Code 환경변수가 비어 있습니다.`);
  }
}


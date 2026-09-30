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
};

export const DEFAULT_SCENE =
  import.meta.env.VITE_DEFAULT_SCENE || "Test03";

export function getMapByScene(sceneId) {
  return MAPS[sceneId] || MAPS[DEFAULT_SCENE] || Object.values(MAPS)[0];
}

export function validateMapConfig(mapConfig) {
  if (!mapConfig?.code) {
    throw new Error(`${mapConfig?.label || "선택된 공간"}의 Map Code 환경변수가 비어 있습니다.`);
  }
}


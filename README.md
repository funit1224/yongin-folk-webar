# 용인민속촌 WebAR

Android Chrome 전용 Multiset VPS 기반 WebAR 프로토타입입니다.

## 실행

```bash
npm install
npm run dev
```

Android 실기기 테스트는 ADB reverse로 연결합니다.

```bash
adb devices
adb reverse tcp:5173 tcp:5173
```

Android Chrome에서 접속합니다.

```text
http://localhost:5173/
```

## 페이지

| 페이지 | 용도 |
| --- | --- |
| `/` | 스플래시 진입 화면 |
| `/webar.html?scene=Test03` | 운영 기준 WebAR 진입 |
| `/webar.html?scene=Test04` | 테스트용 Map WebAR 진입 |
| `/placement-preview.html` | AR 없이 GLB 배치/크기/방향 확인 |

## 환경변수

`.env.example`을 복사해 `.env`를 만들고 Multiset Credential을 입력합니다.

```text
VITE_MULTISET_CLIENT_ID=
VITE_MULTISET_CLIENT_SECRET=
VITE_DEFAULT_SCENE=Test03
VITE_MULTISET_MAP_TEST01=
VITE_MULTISET_MAP_TEST02=
VITE_MULTISET_MAP_TEST03=
VITE_MULTISET_MAP_TEST04=
```

실제 Map Code는 `.env`에만 넣고 GitHub에는 올리지 않습니다.

`Test04`는 개발/검수 테스트용 Map입니다. 운영 기본 장면은 `Test03`으로 유지하고, 테스트할 때만 `/webar.html?scene=Test04`처럼 직접 진입합니다.

## 현재 구조

```text
src/
  config/
    maps.js        Multiset Map 후보 3개
    scenes.js      Map별 GLB 배치 설정
  content/
    glb-content.js GLB 로딩, 재질 보정, 애니메이션
  core/
    multiset-ar.js Multiset/WebXR 세션
    scene3d.js     Three.js 렌더러/카메라/조명
  ui/
    dom.js         화면 요소와 상태 메시지
  splash.js        스플래시 진입 화면
  main.js          AR 앱 진입점
  placement-preview.js
```


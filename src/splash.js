import "./splash.css";
import {
  initializeWebARApp,
  requestARStart,
} from "./main.js";

const startButton = document.querySelector("#start-experience");
const splashShell = document.querySelector(".splash-shell");
const appShell = document.querySelector("#app-shell");

void initializeWebARApp();

startButton.addEventListener("click", () => {
  // 페이지 이동 없이 같은 사용자 터치 안에서 WebAR 시작을 요청합니다.
  splashShell.hidden = true;
  appShell.hidden = false;
  requestARStart();
});


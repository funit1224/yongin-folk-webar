import "./splash.css";

const startButton = document.querySelector("#start-experience");

startButton.addEventListener("click", () => {
  // 스플래시를 터치하면 운영 기준 Test03 WebAR로 진입합니다.
  window.location.href = "/webar.html?scene=Test03";
});


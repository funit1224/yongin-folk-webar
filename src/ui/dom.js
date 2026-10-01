export function getDom() {
  // WebAR 화면에서 반복해서 쓰는 DOM 요소를 한 번에 모읍니다.
  return {
    overlay: document.querySelector("#overlay"),
    sceneSelect: document.querySelector("#scene-select"),
    startButton: document.querySelector("#start-ar"),
    stopButton: document.querySelector("#stop-ar"),
    statusCard: document.querySelector("#status-card"),
    statusTitle: document.querySelector("#status-title"),
    statusDetail: document.querySelector("#status-detail"),
  };
}

export function populateSceneSelect(select, scenes, selectedId) {
  // 설정된 scene 목록으로 테스트용 드롭다운을 구성합니다.
  select.innerHTML = "";
  for (const scene of scenes) {
    const option = document.createElement("option");
    option.value = scene.id;
    option.textContent = scene.label;
    option.selected = scene.id === selectedId;
    select.appendChild(option);
  }
}

export function setStatus(elements, state, title, detail = "") {
  // 상태 카드의 색상과 메시지를 함께 갱신합니다.
  elements.statusCard.className = `status-card status-${state}`;
  elements.statusTitle.textContent = title;
  elements.statusDetail.textContent = detail;
}

export function formatError(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  return error.message || String(error);
}


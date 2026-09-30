export function getDom() {
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
  elements.statusCard.className = `status-card status-${state}`;
  elements.statusTitle.textContent = title;
  elements.statusDetail.textContent = detail;
}

export function formatError(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  return error.message || String(error);
}


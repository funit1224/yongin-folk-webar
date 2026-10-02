import {
  BUTTON_LABELS,
  STATUS_MESSAGES,
} from "../config/messages.js";
import { formatError } from "../ui/dom.js";

const LOCALIZATION_CAPTURE_DELAY_MS = 2500;

export function createARSessionFlow({
  elements,
  setStatus,
}) {
  let multisetAR;
  let scene3d;
  let waitingForUserStart = false;
  let arSessionStarted = false;
  let retryAvailable = false;
  let localizationRun = 0;

  function bindRuntime(runtime) {
    multisetAR = runtime.multisetAR;
    scene3d = runtime.scene3d;
  }

  function setWaitingForUserStart(value) {
    waitingForUserStart = value;
  }

  function handleStartButton() {
    if (retryAvailable && arSessionStarted) {
      void retryLocalization();
      return;
    }

    void startARSession();
  }

  function handleOverlayTap() {
    if (!waitingForUserStart) return;
    waitingForUserStart = false;
    void startARSession();
  }

  function requestStart() {
    waitingForUserStart = true;
    if (multisetAR) {
      void startARSession({
        fallbackToButton: true,
      });
    }
  }

  function stop() {
    multisetAR?.stop();
  }

  async function startARSession({
    fallbackToButton = false,
  } = {}) {
    if (!multisetAR) return;

    resetLocalizationView();
    elements.startButton.disabled = true;
    elements.stopButton.disabled = false;
    elements.startButton.textContent =
      BUTTON_LABELS.scanning;
    setStatus(
      elements,
      "running",
      STATUS_MESSAGES.sessionStarting.title,
      STATUS_MESSAGES.sessionStarting.detail,
    );

    try {
      await multisetAR.start();
      arSessionStarted = true;
      retryAvailable = false;
      waitingForUserStart = false;
      void retryLocalization();
    } catch (error) {
      if (isRecoverableLocalizationError(error)) {
        arSessionStarted = multisetAR.isActive();
        showRetryStatus(error);
        return;
      }

      elements.startButton.disabled = false;
      elements.startButton.textContent =
        BUTTON_LABELS.retry;
      elements.stopButton.disabled = true;
      waitingForUserStart = fallbackToButton;
      setStatus(
        elements,
        fallbackToButton ? "ready" : "error",
        fallbackToButton
          ? STATUS_MESSAGES.startFallback.title
          : STATUS_MESSAGES.arStartFailed.title,
        fallbackToButton
          ? STATUS_MESSAGES.startFallback.detail
          : formatError(error),
      );
    }
  }

  async function retryLocalization() {
    if (!multisetAR) return;

    const runId = ++localizationRun;
    retryAvailable = false;
    elements.startButton.disabled = true;
    elements.startButton.textContent =
      BUTTON_LABELS.scanning;
    setStatus(
      elements,
      "running",
      STATUS_MESSAGES.scanReady.title,
      STATUS_MESSAGES.scanReady.detail,
    );

    try {
      await sleep(LOCALIZATION_CAPTURE_DELAY_MS);
      if (
        runId !== localizationRun ||
        !multisetAR
      ) {
        return;
      }

      const result =
        await multisetAR.localizeFrame();
      if (runId !== localizationRun) return;

      if (!result) {
        showRetryStatus();
      }
    } catch (error) {
      if (runId !== localizationRun) return;
      showRetryStatus(error);
    }
  }

  function handleLocalized() {
    if (scene3d?.root) {
      scene3d.root.visible = true;
    }
    elements.overlay.classList.add("is-localized");
    setStatus(
      elements,
      "success",
      STATUS_MESSAGES.localized.title,
      STATUS_MESSAGES.localized.detail,
    );
  }

  function showRetryStatus(error) {
    retryAvailable = true;
    waitingForUserStart = false;
    elements.startButton.disabled = false;
    elements.startButton.textContent =
      BUTTON_LABELS.retry;
    elements.stopButton.disabled = false;
    setStatus(
      elements,
      "retry",
      STATUS_MESSAGES.retry.title,
      STATUS_MESSAGES.retry.detail,
    );
  }

  function resetLocalizationView() {
    localizationRun += 1;
    retryAvailable = false;
    elements.overlay.classList.remove(
      "is-localized",
    );

    if (scene3d?.root) {
      scene3d.root.visible = false;
    }
  }

  function resetARSessionState() {
    resetLocalizationView();
    arSessionStarted = false;
    waitingForUserStart = false;
    elements.startButton.disabled = false;
    elements.startButton.textContent =
      BUTTON_LABELS.scanIdle;
    elements.stopButton.disabled = true;
    setStatus(
      elements,
      "ready",
      STATUS_MESSAGES.scanReady.title,
      STATUS_MESSAGES.scanReady.detail,
    );
  }

  function resetForSetup() {
    localizationRun += 1;
    multisetAR = undefined;
    scene3d = undefined;
    waitingForUserStart = false;
    arSessionStarted = false;
    retryAvailable = false;
  }

  return {
    bindRuntime,
    handleLocalized,
    handleOverlayTap,
    handleStartButton,
    isRecoverableLocalizationError,
    requestStart,
    resetARSessionState,
    resetForSetup,
    setWaitingForUserStart,
    showRetryStatus,
    startARSession,
    stop,
  };
}

function isRecoverableLocalizationError(error) {
  const message =
    formatError(error).toLowerCase();
  return (
    message.includes("pose") ||
    message.includes("localiz") ||
    message.includes("confidence") ||
    message.includes("attempt")
  );
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

// Chrome docs: pass the same options to availability() and create().
const NANO_OPTIONS = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

const button = document.getElementById('organize');
const statusBox = document.getElementById('status');

function showStatus(text, kind = '') {
  statusBox.hidden = false;
  statusBox.className = `status ${kind}`;
  statusBox.textContent = text;
}

const AVAILABILITY_TIMEOUT_MS = 15000;
const DOWNLOAD_START_TIMEOUT_MS = 30000;

// Like Python's asyncio.wait_for(): rejects if the promise takes too long.
function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

// Checks Gemini Nano from the popup. If the model is not downloaded yet, this
// starts the download - only allowed right after a user click, which is why it
// runs here and not in the service worker.
async function checkNanoInPopup(onProgress) {
  if (typeof LanguageModel === 'undefined') {
    return 'Prompt API not found';
  }
  showStatus('Asking Chrome whether Gemini Nano is available…');
  const availability = await withTimeout(
    LanguageModel.availability(NANO_OPTIONS),
    AVAILABILITY_TIMEOUT_MS,
    'Chrome did not answer the availability check',
  );
  console.log('Popup availability:', availability);
  if (availability !== 'downloadable' && availability !== 'downloading') {
    return availability;
  }

  showStatus(`Gemini Nano is "${availability}". Starting the download…`);
  // If Chrome never reports any download progress, stop waiting and say so.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_START_TIMEOUT_MS);
  try {
    const session = await LanguageModel.create({
      ...NANO_OPTIONS,
      signal: controller.signal,
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          clearTimeout(timer);
          onProgress(e.loaded);
        });
      },
    });
    session.destroy();
  } catch (error) {
    if (controller.signal.aborted) {
      return `${availability}, but the download did not start within ${DOWNLOAD_START_TIMEOUT_MS / 1000} s`;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
  return LanguageModel.availability(NANO_OPTIONS);
}

button.addEventListener('click', async () => {
  button.disabled = true;
  showStatus('Checking Gemini Nano…');
  try {
    const popupResult = await checkNanoInPopup((loaded) => {
      showStatus(`Downloading Gemini Nano… ${Math.round(loaded * 100)}%\nKeep this popup open.`);
    });

    if (popupResult !== 'available') {
      showStatus(
        `Gemini Nano is not available on this computer (${popupResult}).\nNothing was changed.`,
        'error',
      );
      return;
    }

    showStatus('Checking Gemini Nano in the service worker…');
    const workerResult = await withTimeout(
      chrome.runtime.sendMessage({ type: 'checkNano' }),
      60000,
      'The service worker did not answer within 60 s',
    );
    showStatus(
      `Popup: available\nService worker: ${workerResult.text}`,
      workerResult.ok ? 'ok' : 'error',
    );
  } catch (error) {
    showStatus(`Something went wrong: ${error.message}\nNothing was changed.`, 'error');
  } finally {
    button.disabled = false;
  }
});

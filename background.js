// Chrome docs: pass the same options to availability() and create().
const NANO_OPTIONS = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

// Milestone 1 test: can the service worker use Gemini Nano? It checks
// availability, then sends one tiny prompt with a JSON-schema constraint.
async function checkNanoInWorker() {
  if (typeof LanguageModel === 'undefined') {
    return { ok: false, text: 'Prompt API not found here' };
  }
  try {
    const availability = await LanguageModel.availability(NANO_OPTIONS);
    if (availability !== 'available') {
      return { ok: false, text: availability };
    }
    const session = await LanguageModel.create(NANO_OPTIONS);
    const answer = await session.prompt('Reply with the single word OK.', {
      responseConstraint: { type: 'string', enum: ['OK'] },
    });
    session.destroy();
    return { ok: true, text: `available, test answer: ${JSON.parse(answer)}` };
  } catch (error) {
    return { ok: false, text: `error: ${error.message}` };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'checkNano') {
    checkNanoInWorker().then(sendResponse);
    return true; // tells Chrome the reply will come later (asynchronously)
  }
});

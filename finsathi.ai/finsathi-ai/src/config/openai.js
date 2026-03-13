// LLM provider wrapper (OpenAI). Keep all prompt/LLM concerns behind this module.
//
// NOTE: The `openai` npm package should be installed and OPENAI_API_KEY set.
let OpenAI;
try {
  // eslint-disable-next-line global-require
  OpenAI = require('openai');
} catch (e) {
  OpenAI = null;
}

function getOpenAIClient() {
  if (!OpenAI) {
    throw new Error('OpenAI SDK not installed. Add dependency `openai` and reinstall.');
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

module.exports = { getOpenAIClient };


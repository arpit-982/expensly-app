import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// App-wide configuration settings
export const config = {
  featureFlags: {
    // If true, the app will use the OpenRouter API for LLM-based suggestions.
    // This can be controlled by an environment variable.
    enableLlmSuggestions: process.env.VITE_ENABLE_LLM_SUGGESTIONS === 'true',
  },
  llm: {
    // It's recommended to use environment variables for sensitive data like API keys.
    geminiApiKey: process.env.VITE_GEMINI_API_KEY,
    // You can specify a default model to use for suggestions.
    defaultModel: 'gemini-1.5-flash',
  },
};

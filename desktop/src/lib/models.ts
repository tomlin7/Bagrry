/** Groq model catalogs shown in AskBar and Settings → Preferences. */

export const CHAT_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", hint: "Best quality" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B", hint: "Fastest" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout", hint: "Long context" },
  { id: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick", hint: "Highest quality" },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B", hint: "Open weights" },
  { id: "qwen/qwen3-32b", label: "Qwen 3 32B", hint: "Strong reasoning" },
] as const;

export const STT_MODELS = [
  { id: "whisper-large-v3-turbo", label: "Whisper Turbo", hint: "Fast" },
  { id: "whisper-large-v3", label: "Whisper Large v3", hint: "Best accuracy" },
  { id: "distil-whisper-large-v3-en", label: "Distil Whisper EN", hint: "English only" },
] as const;

export const DEFAULT_CHAT_MODEL = CHAT_MODELS[0].id;
export const DEFAULT_STT_MODEL = STT_MODELS[0].id;

export type ChatModelId = (typeof CHAT_MODELS)[number]["id"];
export type SttModelId = (typeof STT_MODELS)[number]["id"];

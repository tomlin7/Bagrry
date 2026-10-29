import path from 'node:path'

export const CONFIG = {
  port: parseInt(process.env.PORT || '47821', 10),
  host: process.env.HOST || '127.0.0.1',
  dbPath: process.env.DB_PATH || path.join(process.cwd(), 'bagrry-server.sqlite'),
  groqApiKey: process.env.GROQ_API_KEY || '',
  defaultChatModel: 'llama-3.3-70b-versatile',
  defaultSttModel: 'whisper-large-v3-turbo',
  whisperCliPath: process.env.WHISPER_CLI || 'whisper-cli',
  version: '1.0.0',
  appName: 'Bagrry Server',
}

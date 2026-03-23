import { getEnvBoolean, getEnvNumber } from '../config/env'

export type AIRuntimeConfig = {
  provider: 'openai' | 'local'
  chatModel: string
  embeddingModel: string
  localModelBaseUrl: string | null
  localModelName: string | null
  maxInputTokens: number
  maxOutputTokens: number
  responseCacheEnabled: boolean
  responseCacheTtlSeconds: number
  vectorBackend: 'prisma' | 'chroma'
}

export function getAIRuntimeConfig(): AIRuntimeConfig {
  const provider = (process.env.AI_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : 'local')).toLowerCase()

  return {
    provider: provider === 'openai' ? 'openai' : 'local',
    chatModel: process.env.AI_CHAT_MODEL || 'gpt-4o-mini',
    embeddingModel: process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small',
    localModelBaseUrl: process.env.LOCAL_LLM_BASE_URL || null,
    localModelName: process.env.LOCAL_LLM_MODEL || null,
    maxInputTokens: getEnvNumber('AI_MAX_INPUT_TOKENS', 2000),
    maxOutputTokens: getEnvNumber('AI_MAX_OUTPUT_TOKENS', 1200),
    responseCacheEnabled: getEnvBoolean('AI_RESPONSE_CACHE_ENABLED', true),
    responseCacheTtlSeconds: getEnvNumber('AI_RESPONSE_CACHE_TTL_SECONDS', 600),
    vectorBackend: (process.env.VECTOR_BACKEND || 'prisma').toLowerCase() === 'chroma' ? 'chroma' : 'prisma',
  }
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.trim().length / 4)
}

export function truncateToTokenLimit(text: string, tokenLimit = getAIRuntimeConfig().maxInputTokens): string {
  if (!text.trim()) {
    return text
  }

  const maxCharacters = tokenLimit * 4
  if (text.length <= maxCharacters) {
    return text
  }

  return text.slice(0, maxCharacters).trim()
}


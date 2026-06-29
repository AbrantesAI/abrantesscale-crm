import Anthropic from '@anthropic-ai/sdk'

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não está definida.')
  return new Anthropic({ apiKey })
}

export const CLAUDE_MODEL = 'claude-opus-4-8'

/**
 * Extrai o texto de uma resposta da Messages API.
 * A resposta vem como um array de blocos (texto, thinking, etc.) —
 * juntamos apenas os blocos de texto.
 */
export function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim()
}

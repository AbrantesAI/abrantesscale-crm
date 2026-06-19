import Groq from 'groq-sdk'

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY não está definida.')
  return new Groq({ apiKey })
}

export const GROQ_MODEL = 'llama-3.3-70b-versatile'

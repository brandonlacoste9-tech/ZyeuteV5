import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

if (!apiKey) {
  console.warn('NEXT_PUBLIC_GEMINI_API_KEY is not set. AI features will not work.')
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function estimateTask(title: string, description: string): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API key not configured')
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `As an experienced software engineer, estimate how long this task would take to complete. Provide a concise estimate (e.g., "2 hours", "1 day", "3 days").

Task: ${title}
Description: ${description}

Provide only the time estimate, nothing else.`

  const result = await model.generateContent(prompt)
  const response = result.response
  return response.text().trim()
}

export async function polishTask(
  title: string,
  description: string
): Promise<{ title: string; description: string }> {
  if (!genAI) {
    throw new Error('Gemini API key not configured')
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `As a professional project manager, rewrite this task to be more clear, professional, and actionable. Keep it concise.

Task: ${title}
Description: ${description}

Respond in JSON format:
{
  "title": "improved title",
  "description": "improved description"
}`

  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text().trim()

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  // Fallback if parsing fails
  return { title, description }
}

export async function expandDream(content: string): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API key not configured')
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `As a creative writer and philosopher, expand on this note/dream with deeper insights, poetic language, and thoughtful reflection. Keep the original meaning but enrich it with additional context and beauty. Maximum 3 paragraphs.

Original: ${content}

Provide only the expanded text.`

  const result = await model.generateContent(prompt)
  const response = result.response
  return response.text().trim()
}

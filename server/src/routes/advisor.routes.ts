import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, createError } from '../middleware/errorHandler'
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware'

const router = Router()

const chatSchema = z.object({
  message: z.string().trim().min(3, 'Please enter a more detailed question.').max(2000),
})

const buildFallbackResponse = (message: string) => {
  const normalized = message.toLowerCase()

  if (normalized.includes('nabil')) {
    return [
      'Nabil Bank is usually evaluated on capital adequacy, non-performing loans, deposit growth, and dividend consistency.',
      'Check the latest annual report for net profit trend, EPS trend, and loan-loss provisioning before buying.',
      'If you want, ask a narrower question like: "Summarize Nabil Bank strengths and risks in 5 bullet points."',
    ].join(' ')
  }

  if (normalized.includes('loan')) {
    return [
      'For a loan decision, compare EMI affordability, emergency fund coverage, and expected interest rate movement.',
      'A practical rule is to keep total monthly debt payments below roughly 35% of take-home income.',
      'Share loan amount, interest rate, tenure, and monthly income for a more specific answer.',
    ].join(' ')
  }

  if (normalized.includes('invest') || normalized.includes('stock') || normalized.includes('mutual fund')) {
    return [
      'A balanced investing answer needs your time horizon, risk tolerance, and liquidity needs.',
      'For most beginners, diversification across fixed income, broad market funds, and a limited stock allocation is safer than concentrated bets.',
      'Ask with an amount and timeline, for example: "How should I invest NPR 100,000 for 5 years?"',
    ].join(' ')
  }

  return [
    'I can help with investing, loans, budgeting, retirement planning, and company analysis.',
    'Ask with your amount, timeline, risk tolerance, or target company for a more useful answer.',
  ].join(' ')
}

async function fetchOpenAIResponse(message: string) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return buildFallbackResponse(message)
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'You are a concise Nepal-focused financial advisor assistant. Give practical, non-hyped guidance and mention risk where relevant.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw createError('AI provider request failed. Check OPENAI_API_KEY and provider availability.', 502)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = data.choices?.[0]?.message?.content?.trim()

  if (!content) {
    throw createError('AI provider returned an empty response.', 502)
  }

  return content
}

router.post(
  '/chat',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { message } = chatSchema.parse(req.body)
    const answer = await fetchOpenAIResponse(message)

    res.json({
      success: true,
      data: {
        answer,
        userId: req.user!.id,
      },
    })
  })
)

export default router

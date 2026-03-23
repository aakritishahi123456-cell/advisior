'use client'

import { FormEvent, startTransition, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bot,
  ChevronRight,
  Circle,
  Loader2,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  User2,
} from 'lucide-react'
import { api } from '@/lib/apiClient'

type SourceItem = {
  relevant_text: string
  source_reference: string
  similarity: number
}

type AdvisorResponse = {
  final_answer: string
  company: {
    symbol: string
    name: string
    sector: string
  }
  agents: {
    retrieval: {
      lowSimilarity: boolean
    }
    risk: {
      riskLevel: 'low' | 'medium' | 'high'
    }
  }
  sources: SourceItem[]
}

type UserMessage = {
  id: string
  role: 'user'
  content: string
  createdAt: string
}

type AssistantMessage = {
  id: string
  role: 'assistant'
  content: string
  renderedContent: string
  createdAt: string
  isStreaming: boolean
  confidenceScore: number
  sources: SourceItem[]
  riskLevel?: 'low' | 'medium' | 'high'
  companyLabel?: string
}

type ChatMessage = UserMessage | AssistantMessage

const starterPrompts = [
  'Is NABIL fundamentally strong?',
  'Analyze NICA growth and risks.',
  'What are the biggest red flags for NBL?',
  'Compare the quality of SCB and EBL.',
]

const initialMessages: ChatMessage[] = [
  {
    id: 'assistant-intro',
    role: 'assistant',
    content:
      'Ask about a listed company and I will retrieve report evidence, explain the reasoning, and show the confidence behind the answer.',
    renderedContent:
      'Ask about a listed company and I will retrieve report evidence, explain the reasoning, and show the confidence behind the answer.',
    createdAt: 'Now',
    isStreaming: false,
    confidenceScore: 88,
    sources: [],
  },
]

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatClock(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function inferCompanyFromQuery(query: string) {
  const match = query.match(/\b[A-Z]{2,6}\b/)
  return match?.[0]
}

function deriveConfidenceScore(response: AdvisorResponse) {
  if (!response.sources.length) {
    return response.agents.retrieval.lowSimilarity ? 34 : 52
  }

  const averageSimilarity =
    response.sources.reduce((sum, source) => sum + source.similarity, 0) / response.sources.length
  const baseScore = Math.round(averageSimilarity * 100)

  if (response.agents.retrieval.lowSimilarity) {
    return Math.max(28, baseScore - 25)
  }

  return Math.min(97, Math.max(42, baseScore))
}

function confidenceTone(score: number) {
  if (score >= 80) {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }
  if (score >= 60) {
    return 'bg-amber-100 text-amber-800 border-amber-200'
  }
  return 'bg-rose-100 text-rose-700 border-rose-200'
}

function riskTone(riskLevel?: 'low' | 'medium' | 'high') {
  if (riskLevel === 'low') {
    return 'text-emerald-700 bg-emerald-100 border-emerald-200'
  }
  if (riskLevel === 'high') {
    return 'text-rose-700 bg-rose-100 border-rose-200'
  }
  return 'text-amber-800 bg-amber-100 border-amber-200'
}

async function streamText(
  fullText: string,
  onChunk: (nextValue: string) => void
) {
  const words = fullText.split(' ')
  let current = ''

  for (let index = 0; index < words.length; index += 1) {
    current = current ? `${current} ${words[index]}` : words[index]
    onChunk(current)
    await new Promise((resolve) => setTimeout(resolve, index < 12 ? 28 : 18))
  }
}

export default function AIAdvisorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const latestAssistant = useMemo(() => {
    return [...messages].reverse().find((message) => message.role === 'assistant') as AssistantMessage | undefined
  }, [messages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isThinking])

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    const query = inputValue.trim()
    if (!query || isSubmitting) {
      return
    }

    const userMessage: UserMessage = {
      id: createId('user'),
      role: 'user',
      content: query,
      createdAt: formatClock(),
    }

    startTransition(() => {
      setMessages((current) => [...current, userMessage])
    })
    setInputValue('')
    setIsSubmitting(true)
    setIsThinking(true)

    try {
      const response = await api.post<AdvisorResponse>('/ai/agents/query', {
        query,
        company: inferCompanyFromQuery(query),
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Unable to generate advisor response.')
      }

      const assistantId = createId('assistant')
      const confidenceScore = deriveConfidenceScore(response.data)
      const assistantMessage: AssistantMessage = {
        id: assistantId,
        role: 'assistant',
        content: response.data.final_answer,
        renderedContent: '',
        createdAt: formatClock(),
        isStreaming: true,
        confidenceScore,
        sources: response.data.sources,
        riskLevel: response.data.agents.risk.riskLevel,
        companyLabel: `${response.data.company.symbol} · ${response.data.company.name}`,
      }

      setIsThinking(false)
      startTransition(() => {
        setMessages((current) => [...current, assistantMessage])
      })

      await streamText(response.data.final_answer, (nextValue) => {
        startTransition(() => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId && message.role === 'assistant'
                ? { ...message, renderedContent: nextValue }
                : message
            )
          )
        })
      })

      startTransition(() => {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId && message.role === 'assistant'
              ? { ...message, renderedContent: message.content, isStreaming: false }
              : message
          )
        )
      })
    } catch (error: any) {
      const fallback =
        error?.error ||
        error?.message ||
        'The advisor could not complete this request. Try a more specific company question.'

      setIsThinking(false)
      startTransition(() => {
        setMessages((current) => [
          ...current,
          {
            id: createId('assistant-error'),
            role: 'assistant',
            content: fallback,
            renderedContent: fallback,
            createdAt: formatClock(),
            isStreaming: false,
            confidenceScore: 22,
            sources: [],
          },
        ])
      })
    } finally {
      setIsSubmitting(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_28%),linear-gradient(135deg,_#fffef8_0%,_#ffffff_42%,_#eff6ff_100%)] p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
        <div className="absolute inset-y-0 right-0 w-80 bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.18),_transparent_60%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              <Sparkles className="h-3.5 w-3.5" />
              AI Advisor
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              A chat workspace for grounded financial answers.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Ask about any company and get a ChatGPT-like response with visible confidence, source evidence,
              and progressive answer rendering.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Latest Confidence</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {latestAssistant ? `${latestAssistant.confidenceScore}%` : '--'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Evidence Chunks</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {latestAssistant?.sources.length ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Risk Signal</p>
              <p className="mt-1 text-2xl font-semibold capitalize text-slate-900">
                {latestAssistant?.riskLevel ?? '--'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_-50px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-[linear-gradient(135deg,_#f8fafc_0%,_#fdfdf7_100%)] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-300/50">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Financial Copilot</p>
                <p className="text-xs text-slate-500">Streaming report-grounded answers</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <Circle className="h-2.5 w-2.5 fill-current" />
              Live
            </div>
          </div>

          <div className="h-[68vh] min-h-[560px] overflow-y-auto bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_24%,_#fffef8_100%)] px-4 py-5 sm:px-6">
            <div className="space-y-5">
              {messages.map((message) => {
                const isUser = message.role === 'user'

                return (
                  <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[88%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                          isUser
                            ? 'bg-slate-950 text-white'
                            : 'bg-[linear-gradient(135deg,_#0f172a_0%,_#0ea5e9_100%)] text-white'
                        }`}
                      >
                        {isUser ? <User2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>

                      <div className="space-y-2">
                        <div
                          className={`rounded-[22px] px-4 py-3 shadow-sm ${
                            isUser
                              ? 'rounded-tr-md bg-slate-950 text-white'
                              : 'rounded-tl-md border border-slate-200 bg-white text-slate-800'
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-6">
                            {isUser ? message.content : message.renderedContent}
                          </p>
                        </div>

                        {!isUser && (
                          <div className="space-y-3">
                            {message.companyLabel && (
                              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                                <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                                {message.companyLabel}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${confidenceTone(
                                  message.confidenceScore
                                )}`}
                              >
                                Confidence {message.confidenceScore}%
                              </span>
                              {message.riskLevel && (
                                <span
                                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${riskTone(
                                    message.riskLevel
                                  )}`}
                                >
                                  Risk {message.riskLevel}
                                </span>
                              )}
                              {message.isStreaming && (
                                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Streaming
                                </span>
                              )}
                            </div>

                            {message.sources.length > 0 && (
                              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                    Source References
                                  </p>
                                  <p className="text-xs text-slate-400">{message.sources.length} chunks</p>
                                </div>
                                <div className="space-y-2">
                                  {message.sources.slice(0, 3).map((source, index) => (
                                    <div
                                      key={`${message.id}-${index}`}
                                      className="rounded-2xl border border-white bg-white px-3 py-2 shadow-sm"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <p className="text-xs font-semibold text-slate-700">
                                          {source.source_reference}
                                        </p>
                                        <span className="rounded-full bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700">
                                          {Math.round(source.similarity * 100)}%
                                        </span>
                                      </div>
                                      <p className="mt-2 text-xs leading-5 text-slate-500">
                                        {source.relevant_text}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <p className="text-xs text-slate-400">{message.createdAt}</p>
                          </div>
                        )}

                        {isUser && <p className="text-right text-xs text-slate-400">{message.createdAt}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="flex max-w-[88%] gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#0f172a_0%,_#0ea5e9_100%)] text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="space-y-2">
                      <div className="rounded-[22px] rounded-tl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                          <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse [animation-delay:120ms]" />
                          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse [animation-delay:240ms]" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">Typing and checking sources…</p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6"
          >
            <div className="rounded-[26px] border border-slate-200 bg-slate-50 px-3 py-3 shadow-inner shadow-slate-100">
              <div className="flex items-end gap-3">
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Ask about quality, growth, red flags, or valuation…"
                  className="min-h-[48px] flex-1 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !inputValue.trim()}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#0f172a_0%,_#0ea5e9_100%)] text-white shadow-lg shadow-sky-200 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_-50px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-600" />
              <h2 className="font-semibold text-slate-900">Quick Starts</h2>
            </div>
            <div className="mt-4 space-y-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInputValue(prompt)}
                  className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-slate-900"
                >
                  <span>{prompt}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:text-sky-600" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(145deg,_#0f172a_0%,_#1e293b_70%,_#334155_100%)] p-5 text-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.7)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Response Card</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-slate-300">What this UI shows</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-100">
                  <li>Chat bubbles with progressive rendering</li>
                  <li>Typing indicator and loading states</li>
                  <li>Source references per answer</li>
                  <li>Confidence score based on retrieval quality</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Performance</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Responses render progressively on the client so the chat feels live even when the API returns a
                  completed answer object.
                </p>
              </div>
            </div>
          </div>

          {latestAssistant?.sources.length ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_-50px_rgba(15,23,42,0.35)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Latest Sources</p>
              <div className="mt-4 space-y-3">
                {latestAssistant.sources.slice(0, 4).map((source, index) => (
                  <div key={`latest-source-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-700">{source.source_reference}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{source.relevant_text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

# MVP Improvement Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve MVP quality by fixing backend behavior drift, reducing route ambiguity in the active TypeScript runtime, and replacing hardcoded dashboard content with API-backed data and resilient fallbacks.

**Architecture:** The implementation keeps `server/src/index.ts` as the primary backend runtime, applies TDD to the currently failing backend services first, then adds a small dashboard data layer in the web app without redesigning the existing UI. The dashboard will fetch data from existing backend endpoints where available and gracefully degrade to safe fallback content when network or API gaps occur.

**Tech Stack:** Node.js, Express, TypeScript, Jest, Next.js App Router, React, Axios

---

## File Structure

- Modify: `server/src/services/__tests__/financialDataRetrieval.service.test.ts`
  Confirms the service returns structured data including provenance fields.
- Modify: `server/src/services/__tests__/finalFinancialAnswer.service.test.ts`
  Aligns the expected fallback response with current non-hallucinatory service behavior.
- Modify: `server/src/index.ts`
  Removes or reduces overlapping runtime route registrations in the active TypeScript backend.
- Create: `apps/web/lib/dashboard.ts`
  Centralizes dashboard fetch logic and fallback mapping for the web app.
- Modify: `apps/web/app/dashboard/page.tsx`
  Replaces hardcoded arrays with live dashboard data and loading-safe rendering.

### Task 1: Fix Financial Data Retrieval Test Drift

**Files:**
- Modify: `server/src/services/__tests__/financialDataRetrieval.service.test.ts`
- Test: `server/src/services/__tests__/financialDataRetrieval.service.test.ts`

- [ ] **Step 1: Write the failing test expectation**

```ts
expect(result).toEqual({
  company: 'NABIL',
  data: {
    revenue: 1000,
    profit: 220,
    growth: 12.5,
    latest_price: 560,
    PE_ratio: 18.4,
  },
  sources: ['financials_latest', 'nepse_price_data'],
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=server -- server/src/services/__tests__/financialDataRetrieval.service.test.ts --runInBand`
Expected: `FAIL` because the old test omits the `sources` array returned by the current service.

- [ ] **Step 3: Update the second test for empty provenance**

```ts
expect(result).toEqual({
  company: 'NABIL',
  data: {
    revenue: null,
    profit: null,
    growth: null,
    latest_price: null,
    PE_ratio: null,
  },
  sources: [],
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=server -- server/src/services/__tests__/financialDataRetrieval.service.test.ts --runInBand`
Expected: `PASS`

### Task 2: Fix Final Financial Answer Test Drift

**Files:**
- Modify: `server/src/services/__tests__/finalFinancialAnswer.service.test.ts`
- Test: `server/src/services/__tests__/finalFinancialAnswer.service.test.ts`

- [ ] **Step 1: Write the failing fallback expectations**

```ts
expect(result).toBe('No verified data available')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=server -- server/src/services/__tests__/finalFinancialAnswer.service.test.ts --runInBand`
Expected: `FAIL` because the old test still expects `Insufficient data`.

- [ ] **Step 3: Update all fallback-only expectations**

```ts
test('does not hallucinate for broad unsupported questions like "Best stock in Nepal?"', async () => {
  FinancialDataRetrievalService.fetchRelevantFinancialData.mockRejectedValue(new Error('No matching company'))

  const result = await FinalFinancialAnswerService.generate({ query: 'Best stock in Nepal?' })

  expect(result).toBe('No verified data available')
})
```

```ts
test('returns fallback text when verified analysis is unavailable', async () => {
  FinancialDataRetrievalService.fetchRelevantFinancialData.mockResolvedValue({
    company: 'NABIL',
    data: {
      revenue: null,
      profit: null,
      growth: null,
      latest_price: null,
      PE_ratio: null,
    },
    sources: [],
  })
  FinancialDataAnalysisService.analyze.mockReturnValue('INSUFFICIENT DATA')

  const result = await FinalFinancialAnswerService.generate({ query: 'Is NABIL a good investment?' })

  expect(result).toBe('No verified data available')
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=server -- server/src/services/__tests__/finalFinancialAnswer.service.test.ts --runInBand`
Expected: `PASS`

### Task 3: Remove Active Runtime Route Duplication

**Files:**
- Modify: `server/src/index.ts`
- Test: `server/src/index.ts`

- [ ] **Step 1: Identify the canonical versioned mounts to keep**

Keep the versioned mounts and remove overlapping aliases that point to the same handlers:

```ts
app.use('/api/v1/loans', loanRoutes)
app.use('/api/v1/reports', financialReportRoutes)
app.use('/api/v1/portfolio', portfolioRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/subscription', subscriptionRoutes)
app.use('/api/v1/referral', referralRoutes)
app.use('/api/v1/analytics', analyticsRoutes)
```

- [ ] **Step 2: Remove duplicate aliases from the active runtime**

Delete overlapping lines such as:

```ts
app.use('/api/v1/loan', loanRoutes)
app.use('/api/v1/reports', reportParserRoutes)
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/market', marketLiveRoutes)
app.use('/api/v1/payment', paymentRoutes)
app.use('/payment', paymentRoutes)
app.use('/corporate-actions', corporateActionsRoutes)
app.use('/stocks', stocksRoutes)
app.use('/subscription', subscriptionRoutes)
app.use('/referral', referralRoutes)
app.use('/analytics', analyticsRoutes)
app.use('/loans', loanRoutes)
app.use('/loan', loanRoutes)
```

- [ ] **Step 3: Keep necessary additional mounts only when they represent different feature scopes**

Retain distinct mounts that are not duplicates, for example:

```ts
app.use('/api/v1/reports', financialReportRoutes)
app.use('/api/v1/report-parser', reportParserRoutes)
```

If `reportParserRoutes` cannot be remounted cleanly under a distinct path, leave it unchanged and document the reason in the final summary.

- [ ] **Step 4: Run targeted verification**

Run: `npm test --workspace=server -- server/src/services/__tests__/financialDataRetrieval.service.test.ts server/src/services/__tests__/finalFinancialAnswer.service.test.ts --runInBand`
Expected: `PASS`

### Task 4: Build Dashboard Data Access Layer

**Files:**
- Create: `apps/web/lib/dashboard.ts`
- Modify: `apps/web/lib/apiClient.ts`
- Test: `apps/web/lib/dashboard.ts`

- [ ] **Step 1: Add typed dashboard fetch helpers**

```ts
import { api, endpoints } from './apiClient'

export interface DashboardSnapshot {
  metrics: {
    totalPortfolio: string
    monthlyReturns: string
    totalInvestments: string
    ytdReturns: string
  }
  performanceData: Array<{ month: string; value: number }>
  allocationData: Array<{ name: string; value: number; color: string }>
  topStocks: Array<{ symbol: string; name: string; price: number; change: number }>
  aiInsights: Array<{ type: 'opportunity' | 'warning' | 'info'; title: string; description: string; time: string }>
}
```

- [ ] **Step 2: Implement resilient fetch with fallback**

```ts
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  try {
    const [analyticsRes, subscriptionRes] = await Promise.allSettled([
      api.get(endpoints.analytics.dashboard),
      api.get(endpoints.subscriptions.current),
    ])

    return mapDashboardSnapshot({ analyticsRes, subscriptionRes })
  } catch {
    return buildFallbackDashboardSnapshot()
  }
}
```

- [ ] **Step 3: Provide deterministic fallback content**

```ts
function buildFallbackDashboardSnapshot(): DashboardSnapshot {
  return {
    metrics: {
      totalPortfolio: 'NPR 0',
      monthlyReturns: 'NPR 0',
      totalInvestments: 'NPR 0',
      ytdReturns: '0%',
    },
    performanceData: [],
    allocationData: [],
    topStocks: [],
    aiInsights: [
      {
        type: 'info',
        title: 'Dashboard data unavailable',
        description: 'Connect the backend services to see live portfolio, market, and AI insight data.',
        time: 'just now',
      },
    ],
  }
}
```

- [ ] **Step 4: Run type-safe verification**

Run: `npm run build --workspace=apps/web`
Expected: `Compiled successfully` or equivalent successful Next.js build output.

### Task 5: Wire Dashboard Page to Live Data

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx`
- Create: `apps/web/lib/dashboard.ts`
- Test: `apps/web/app/dashboard/page.tsx`

- [ ] **Step 1: Replace hardcoded arrays with state sourced from the dashboard helper**

```tsx
const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  let cancelled = false

  getDashboardSnapshot()
    .then((data) => {
      if (!cancelled) setSnapshot(data)
    })
    .finally(() => {
      if (!cancelled) setLoading(false)
    })

  return () => {
    cancelled = true
  }
}, [])
```

- [ ] **Step 2: Update the render paths to use live values**

```tsx
const metrics = [
  {
    title: 'Total Portfolio',
    value: snapshot?.metrics.totalPortfolio ?? 'NPR 0',
    change: 0,
    trend: 'up',
    icon: <Wallet className="w-5 h-5" />,
  },
]
```

- [ ] **Step 3: Add loading-safe empty states for charts and lists**

```tsx
{loading ? (
  <Skeleton className="h-full w-full" />
) : snapshot?.topStocks.length ? (
  snapshot.topStocks.map((stock) => /* existing card render */)
) : (
  <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No live stock data available yet.</div>
)}
```

- [ ] **Step 4: Run web verification**

Run: `npm run build --workspace=apps/web`
Expected: `PASS`

### Task 6: Final Verification

**Files:**
- Test: `server/src/services/__tests__/financialDataRetrieval.service.test.ts`
- Test: `server/src/services/__tests__/finalFinancialAnswer.service.test.ts`
- Test: `apps/web/app/dashboard/page.tsx`
- Test: `server/src/index.ts`

- [ ] **Step 1: Run targeted backend tests**

Run: `npm test --workspace=server -- server/src/services/__tests__/financialDataRetrieval.service.test.ts server/src/services/__tests__/finalFinancialAnswer.service.test.ts --runInBand`
Expected: `PASS`

- [ ] **Step 2: Run broader server verification**

Run: `npm test --workspace=server -- --runInBand`
Expected: all previously failing suites now pass; if unrelated suites fail, capture them explicitly in the final summary.

- [ ] **Step 3: Run web build verification**

Run: `npm run build --workspace=apps/web`
Expected: `PASS`

- [ ] **Step 4: Summarize residual risk**

```text
- Remaining legacy JS backend files are still present but no longer the primary runtime path.
- Dashboard data quality is bounded by currently available backend endpoints.
- Coverage thresholds may still need follow-up work if the broader suite reports unrelated gaps.
```

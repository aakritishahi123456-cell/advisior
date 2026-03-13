export type FinancialProfileDraft = {
  incomeMonthly?: number
  incomeSource?: 'SALARY' | 'BUSINESS' | 'FREELANCE' | 'RENTAL' | 'OTHER'
  savingsTotal?: number
  debtTotal?: number
  goals?: Array<'RETIREMENT' | 'EDUCATION' | 'HOUSE' | 'WEALTH_GROWTH' | 'EMERGENCY_FUND'>
  riskTolerance?: 'CONSERVATIVE' | 'BALANCED' | 'GROWTH' | 'AGGRESSIVE'
}

const STORAGE_KEY = 'finsathi.financialProfileDraft.v1'

export function loadFinancialProfileDraft(): FinancialProfileDraft {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as FinancialProfileDraft
  } catch {
    return {}
  }
}

export function saveFinancialProfileDraft(next: FinancialProfileDraft) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function clearFinancialProfileDraft() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}


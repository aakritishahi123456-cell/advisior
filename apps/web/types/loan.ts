export type LoanScheduleItem = {
  month: number
  principal: number
  interest: number
  emi: number
  balance: number
}

export type LoanSimulationResult = {
  emi: number
  totalInterest: number
  totalPayment: number
  principal: number
  interestRate: number
  tenure: number
  schedule?: LoanScheduleItem[]
}


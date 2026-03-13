import FintechShell from '@/components/fintech/FintechShell'

export const metadata = {
  title: 'FinSathi AI — Fintech Dashboard',
}

export default function FintechLayout({ children }: { children: React.ReactNode }) {
  return <FintechShell>{children}</FintechShell>
}


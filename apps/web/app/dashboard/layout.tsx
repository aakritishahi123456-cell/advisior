import DashboardShell from '@/components/platform/DashboardShell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}

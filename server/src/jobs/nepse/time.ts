export const NEPAL_TZ = 'Asia/Kathmandu'

export function nepseBusinessDateISO(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: NEPAL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date) // YYYY-MM-DD
}

export function parseISODate(dateISO: string): Date {
  // Interpret YYYY-MM-DD as Nepal local date; store as UTC midnight-equivalent.
  // For aggregation/uniqueness, we only care about the calendar date.
  const [y, m, d] = dateISO.split('-').map((v) => Number(v))
  return new Date(Date.UTC(y, m - 1, d))
}


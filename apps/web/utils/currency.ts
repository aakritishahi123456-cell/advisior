export function formatNPR(value: number) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return 'NPR —'
  return `NPR ${numberValue.toLocaleString()}`
}


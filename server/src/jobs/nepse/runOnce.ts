import { runNepseCollector } from './nepseCollector'

async function main() {
  const businessDateISO = process.env.NEPSE_BUSINESS_DATE
  const result = await runNepseCollector({ businessDateISO: businessDateISO || undefined })
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2))
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exitCode = 1
})


import { spawnSync } from 'node:child_process'

const script = process.env.RENDER === 'true' ? 'start:render' : 'start:all'
const result = spawnSync('npm', ['run', script], { stdio: 'inherit', shell: true })

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

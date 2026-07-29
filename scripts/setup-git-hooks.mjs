import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

if (!existsSync('.git')) {
  process.exit(0)
}

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' })
  console.log('Git hooks enabled: core.hooksPath=.githooks')
} catch {
  console.warn('Git hooks setup skipped. Run `git config core.hooksPath .githooks` manually.')
}

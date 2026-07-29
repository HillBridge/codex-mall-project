import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const eslintExtensions = new Set(['.js', '.mjs', '.ts', '.vue'])
const prettierExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.vue',
  '.yaml',
  '.yml'
])

const stagedFiles = readStagedFiles().filter((file) => existsSync(file))
const eslintFiles = stagedFiles.filter((file) => eslintExtensions.has(readExtension(file)))
const prettierFiles = stagedFiles.filter((file) => prettierExtensions.has(readExtension(file)))

runStep('Type check', ['pnpm', ['typecheck']])

if (eslintFiles.length) {
  runStep('ESLint staged files', ['pnpm', ['exec', 'eslint', '--max-warnings=0', ...eslintFiles]])
}

if (prettierFiles.length) {
  runStep('Prettier staged files', [
    'pnpm',
    ['exec', 'prettier', '--check', '--ignore-unknown', ...prettierFiles]
  ])
}

console.log('Pre-commit quality checks passed.')

function readStagedFiles() {
  const output = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
    encoding: 'utf8'
  })

  return output
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean)
}

function readExtension(file) {
  const match = file.match(/(\.[^.]+)$/)
  return match?.[1] || ''
}

function runStep(label, [command, args]) {
  console.log(`\n> ${label}`)

  try {
    execFileSync(command, args, { stdio: 'inherit' })
  } catch {
    console.error(`\n${label} failed.`)
    console.error('Fix the issue, then stage the changed files and commit again.')
    process.exit(1)
  }
}

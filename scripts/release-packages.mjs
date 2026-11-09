#!/usr/bin/env node
// Release helper for the npm packages published from this repo:
//   @ynput/ayon-addon            addon/
//   @ynput/ayon-frontend-shared  shared/
//   @ynput/ayon-addon-dev        addon-dev/
//   @ynput/ayon-e2e              e2e/
//
// Run from the repo root through yarn (the release:* scripts in package.json):
//   yarn release:start                      guided changes -> branch -> bump -> PR/merge -> build -> publish
//   yarn release:status                     local origin/develop version vs npm, per package
//   yarn release:changes [--json|--verbose] what merged since each package's last npm release, and the
//                                           signals that decide patch / minor / major
//   yarn release:bump                     suggest bumps, confirm (Enter or y), then commit and push
//   yarn release:bump <pkg>=<level> ...     set explicit versions without prompts; <level> is patch,
//                                           minor, major or x.y.z. Run on a release branch, never develop.
//   yarn release:check                      are versions and cross-package pins consistent?
//   yarn release:build                      build:addon and build:e2e
//   yarn release:publish [pkg ...] [--dry-run] [--yes] [--otp <code>] [--force]
//                                           build, then npm publish what npm does not have yet, in order
//
// --repo <dir> runs a command against another checkout or worktree (default: this repo).
// start, status, changes, interactive bump and publish fetch origin.
// bump needs clean release files and an origin remote; it pushes the current release branch.
// publish needs HEAD at origin/develop, a clean tree and npm login.
// Human output is summary-first; --verbose includes release baselines, PR metadata and dependency diffs.
// Colour is automatic in terminals (NO_COLOR disables it; FORCE_COLOR=1 enables it in pipes).
//
// start requires a terminal, a clean checkout, gh authentication and installed root dependencies.
// It never bypasses GitHub protections; interrupted releases can be continued with release:start.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline/promises'
import { setTimeout } from 'node:timers/promises'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// key = short name on the command line. PUBLISH_ORDER: a package goes out after the ones it pins.
const PACKAGES = {
  addon: { dir: 'addon', name: '@ynput/ayon-addon' },
  shared: { dir: 'shared', name: '@ynput/ayon-frontend-shared' },
  'addon-dev': { dir: 'addon-dev', name: '@ynput/ayon-addon-dev' },
  e2e: { dir: 'e2e', name: '@ynput/ayon-e2e' },
}
const PUBLISH_ORDER = ['addon', 'shared', 'addon-dev', 'e2e']
const ARC = '@ynput/ayon-react-components'
const BASE = 'origin/develop'
// generated from the backend's OpenAPI / GraphQL: kept apart from hand-written code when reading diffs
const GENERATED = /\/generated\/|\.graphql\.|graphql\.schema/
const RELEASE_BRANCH_PREFIX = 'chore/release-packages-'
const RELEASE_FILES = [
  ...Object.values(PACKAGES).map(({ dir }) => `${dir}/package.json`),
  'addon/AGENTS.md',
]

const colourEnabled = (stream) =>
  !('NO_COLOR' in process.env) &&
  process.env.FORCE_COLOR !== '0' &&
  (Boolean(stream.isTTY) || Boolean(process.env.FORCE_COLOR))

const paint = (text, tone, stream = process.stdout) => {
  const codes = { bold: 1, muted: 2, red: 31, green: 32, yellow: 33, cyan: 36 }
  return colourEnabled(stream) ? `\x1b[${codes[tone]}m${text}\x1b[0m` : String(text)
}

const section = (title) => console.log(`\n${paint(title, 'bold')}`)

// Wrap before colouring so ANSI codes never count towards the terminal width.
const line = (text, { indent = 2, tone, prefix = '' } = {}) => {
  const width = Math.max(20, Math.min(process.stdout.columns || 100, 100) - indent - prefix.length)
  const words = String(text).split(/\s+/).filter(Boolean)
  const rows = []
  let row = ''
  for (const word of words) {
    if (row && row.length + word.length + 1 > width) {
      rows.push(row)
      row = ''
    }
    row += `${row ? ' ' : ''}${word}`
  }
  if (row) rows.push(row)
  for (const [i, text] of rows.entries()) {
    const start = ' '.repeat(indent) + (i ? ' '.repeat(prefix.length) : prefix)
    console.log(start + (tone ? paint(text, tone) : text))
  }
}

const count = (n, noun) => `${n} ${noun}${n === 1 ? '' : 's'}`

const nextStep = (text) => {
  section('Next step')
  line(text, { tone: 'cyan' })
}

const printProblems = (problems) => {
  section(
    problems.length ? `FAIL  ${count(problems.length, 'release issue')}` : 'PASS  Release checks',
  )
  if (problems.length) {
    for (const problem of problems) line(problem, { prefix: '- ', tone: 'red' })
  } else {
    line('Package versions and dependency pins are consistent.', { tone: 'green' })
  }
}

const die = (msg) => {
  console.error(paint(`ERROR  ${msg}`, 'red', process.stderr))
  process.exit(1)
}

const isConfirmed = (answer) => ['', 'y', 'yes'].includes(answer.trim().toLowerCase())

const confirm = async (question) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    while (true) {
      const answer = (await rl.question(`${question} [Y/n] `)).trim().toLowerCase()
      if (isConfirmed(answer)) return true
      if (['n', 'no'].includes(answer)) return false
      line('Choose y to continue or n to stop.', { tone: 'yellow' })
    }
  } finally {
    rl.close()
  }
}

// stdout of a command, trimmed. A failure stops with its stderr, unless check is false (then '').
const sh = (cmd, args, { cwd, check = true } = {}) => {
  try {
    return execFileSync(cmd, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 256 * 1024 * 1024,
    }).trim()
  } catch (e) {
    if (check)
      die(`${[cmd, ...args].join(' ')}\n${String(e.stderr || e.stdout || e.message).trim()}`)
    return ''
  }
}

const git = (repo, ...args) => sh('git', ['-C', repo, ...args])

const gitOk = (repo, ...args) => {
  try {
    execFileSync('git', ['-C', repo, ...args], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const pkgJson = (repo, key, ref) => {
  if (ref) return JSON.parse(git(repo, 'show', `${ref}:${PACKAGES[key].dir}/package.json`))
  return JSON.parse(readFileSync(path.join(repo, PACKAGES[key].dir, 'package.json'), 'utf8'))
}

const semver = (v) => v.split('-')[0].split('.').map(Number)
const cmpSemver = (a, b) => {
  const x = semver(a)
  const y = semver(b)
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]
  return 0
}

const bumped = (v, level) => {
  if (/^\d+\.\d+\.\d+$/.test(level)) return level
  const [major, minor, patch] = semver(v)
  if (level === 'major') return `${major + 1}.0.0`
  if (level === 'minor') return `${major}.${minor + 1}.0`
  if (level === 'patch') return `${major}.${minor}.${patch + 1}`
  return die(`bump level must be patch, minor, major or x.y.z, not '${level}'`)
}

const npmInfo = (name) => {
  try {
    return JSON.parse(
      execFileSync('npm', ['view', name, 'version', 'gitHead', '--json'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    )
  } catch {
    return {}
  }
}

const npmLoggedIn = () => {
  try {
    execFileSync('npm', ['whoami'], { stdio: ['ignore', 'pipe', 'ignore'] })
    return true
  } catch {
    return false
  }
}

// [commit of the last release, npm version, how the commit was found]. The npm gitHead is the commit a
// release was published from; when it is not in develop's history, use the last commit that set the version.
const baseline = (repo, key) => {
  const info = npmInfo(PACKAGES[key].name)
  const head = info.gitHead || ''
  if (head && gitOk(repo, 'merge-base', '--is-ancestor', head, BASE)) {
    return [head, info.version ?? '?', 'npm gitHead']
  }
  const last = git(
    repo,
    'log',
    '-1',
    '--format=%H',
    '-G',
    '"version"',
    BASE,
    '--',
    `${PACKAGES[key].dir}/package.json`,
  )
  return [
    last,
    info.version ?? '?',
    'last commit that changed the version (npm gitHead not usable)',
  ]
}

// `release:status` fetches origin and compares each package version on origin/develop with
// the version currently published to npm. It does not inspect the working-tree versions.
const cmdStatus = (repo) => {
  git(repo, 'fetch', '-q', 'origin')
  section('Package release status')
  line(`Comparing ${BASE} with npm.`, { tone: 'muted' })
  console.log()
  console.log(
    paint(`  ${'PACKAGE'.padEnd(32)} ${'DEVELOP'.padEnd(10)} ${'NPM'.padEnd(10)} STATUS`, 'muted'),
  )
  for (const key of PUBLISH_ORDER) {
    const local = pkgJson(repo, key, BASE).version
    const npm = npmInfo(PACKAGES[key].name).version ?? '?'
    const state = npm === '?' ? 'UNKNOWN' : local === npm ? 'PUBLISHED' : 'NOT ON NPM'
    const tone = state === 'PUBLISHED' ? 'green' : 'yellow'
    console.log(
      `  ${PACKAGES[key].name.padEnd(32)} ${local.padEnd(10)} ${npm.padEnd(10)} ${paint(
        state,
        tone,
      )}`,
    )
    if (npm === '?') line('Could not read the npm version.', { indent: 4, tone: 'yellow' })
  }
}

// `release:changes` starts at each package's last npm release commit (or, if that commit is
// not in origin/develop, its most recent version-changing commit). It lists first-parent
// merges that touched the package and reports hand-written exports, generated REST API
// changes, package.json edits, and available PR titles/labels to inform a manual bump choice.
// exported names declared on a diff line; prefix is '-' or '\\+' (the diff sign)
const exportedNames = (lines, prefix) => {
  const out = new Set()
  const decl = new RegExp(
    `^${prefix}export (?:declare )?(?:const|let|function|class|type|interface|enum|async function) (\\w+)`,
  )
  const list = new RegExp(`^${prefix}export (?:type )?\\{([^}]*)\\}`)
  for (const ln of lines) {
    let m = ln.match(decl)
    if (m) {
      out.add(m[1])
      continue
    }
    m = ln.match(list)
    if (m) {
      for (const part of m[1].split(',')) {
        const name = part.trim().split(' as ').pop().trim()
        if (name) out.add(name)
      }
    }
  }
  return out
}

// RTK Query endpoint name -> the queryArg props its request reads (generated REST files)
const endpointArgs = (text) => {
  const parts = text.split(/\n {4}(\w+): build\.(?:query|mutation)/)
  const out = new Map()
  for (let i = 1; i < parts.length - 1; i += 2) {
    out.set(parts[i], new Set([...parts[i + 1].matchAll(/queryArg\.(\w+)/g)].map((m) => m[1])))
  }
  return out
}

// Endpoints removed/added, and endpoints whose argument props changed, in the generated REST files of a
// package. A removed or renamed arg prop (`listId` -> `entityListId`) breaks every caller of that hook.
const generatedApiChanges = (repo, base, files) => {
  const old = new Map()
  const now = new Map()
  for (const f of files) {
    if (!f.includes('/generated/') || !f.endsWith('.ts')) continue
    for (const [ref, into] of [
      [base, old],
      [BASE, now],
    ]) {
      const text = sh('git', ['-C', repo, 'show', `${ref}:${f}`], { check: false })
      for (const [ep, args] of endpointArgs(text)) into.set(ep, args)
    }
  }
  const removed = [...old.keys()].filter((k) => !now.has(k)).sort()
  const added = [...now.keys()].filter((k) => !old.has(k)).sort()
  const changed = []
  for (const ep of [...old.keys()].filter((k) => now.has(k)).sort()) {
    const gone = [...old.get(ep)].filter((a) => !now.get(ep).has(a)).sort()
    if (!gone.length) continue
    const fresh = [...now.get(ep)].filter((a) => !old.get(ep).has(a)).sort()
    changed.push(`${ep}: ${gone.join(', ')} -> ${fresh.join(', ') || '(gone)'}`)
  }
  return { removed, added, changed }
}

const isDiffChange = (l) =>
  (l.startsWith('+') || l.startsWith('-')) && !l.startsWith('+++') && !l.startsWith('---')

// Facts in the diff that bear on the bump. The judgement stays with the reader.
const signals = (repo, base, key) => {
  const d = PACKAGES[key].dir
  const diff = git(repo, 'diff', '-U0', base, BASE, '--', d)
  const files = git(repo, 'diff', '--name-only', base, BASE, '--', d).split('\n').filter(Boolean)
  const hand = []
  let generated = false
  for (const ln of diff.split('\n')) {
    if (ln.startsWith('diff --git')) generated = GENERATED.test(ln)
    else if (isDiffChange(ln) && !generated) hand.push(ln) // generated API is read from the files, see below
  }
  const removed = exportedNames(
    hand.filter((l) => l.startsWith('-')),
    '-',
  )
  const added = exportedNames(
    hand.filter((l) => l.startsWith('+')),
    '\\+',
  )
  const api = generatedApiChanges(repo, base, files)
  const pj = git(repo, 'diff', '-U0', base, BASE, '--', `${d}/package.json`)
  return {
    files: files.length,
    generated_files: files.filter((f) => GENERATED.test(f)).length,
    removed_exports: [...removed].filter((x) => !added.has(x)).sort(),
    added_exports: [...added].filter((x) => !removed.has(x)).sort(),
    generated_changed_args: api.changed,
    generated_removed_endpoints: api.removed,
    generated_added_endpoints: api.added,
    package_json_changes: pj.split('\n').filter(isDiffChange),
  }
}

const prInfo = (num, cache) => {
  if (!cache.has(num)) {
    try {
      const j = JSON.parse(
        execFileSync(
          'gh',
          ['pr', 'view', num, '--repo', 'ynput/ayon-frontend', '--json', 'title,labels,url'],
          {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
          },
        ),
      )
      cache.set(num, { title: j.title, labels: j.labels.map((l) => l.name), url: j.url })
    } catch {
      cache.set(num, { title: '(gh unavailable)', labels: [], url: '' })
    }
  }
  return cache.get(num)
}

const collect = (repo) => {
  git(repo, 'fetch', '-q', 'origin')
  const out = {}
  const cache = new Map()
  for (const key of PUBLISH_ORDER) {
    const [base, npmVersion, how] = baseline(repo, key)
    const d = PACKAGES[key].dir
    const rows = git(
      repo,
      'log',
      '--first-parent',
      '--format=%H%x09%h%x09%s',
      `${base}..${BASE}`,
      '--',
      d,
    )
      .split('\n')
      .filter(Boolean)
    const items = rows.map((row) => {
      const [full, short, ...rest] = row.split('\t')
      const subject = rest.join('\t')
      const entry = { commit: short, subject }
      const m = subject.match(/Merge pull request #(\d+)/)
      if (m) Object.assign(entry, { pr: Number(m[1]) }, prInfo(m[1], cache))
      const stat = git(repo, 'diff', '--numstat', `${full}^1`, full, '--', d)
        .split('\n')
        .filter(Boolean)
      entry.files = stat.length
      entry.generated_files = stat.filter((s) => GENERATED.test(s.split('\t')[2] ?? '')).length
      return entry
    })
    out[key] = {
      name: PACKAGES[key].name,
      local_version: pkgJson(repo, key, BASE).version,
      npm_version: npmVersion,
      baseline: git(repo, 'rev-parse', '--short', base),
      baseline_source: how,
      changes: items,
      signals: signals(repo, base, key),
    }
  }
  return out
}

const hasChanges = (p) => p.changes.length > 0 || p.signals.files > 0
const isPendingRelease = (p) =>
  p.npm_version !== '?' && cmpSemver(p.local_version, p.npm_version) > 0

const printChanges = (data, { verbose, showNext = true } = {}) => {
  const changed = Object.values(data).filter(hasChanges)
  section('Changes since the last npm release')
  line(`${changed.length} of ${PUBLISH_ORDER.length} packages have changes.`, {
    tone: changed.length ? 'yellow' : 'green',
  })
  console.log()
  for (const p of Object.values(data)) {
    const touched = hasChanges(p)
    const status = touched ? 'CHANGED' : 'NO CHANGES'
    console.log(
      `  ${paint(status.padEnd(12), touched ? 'yellow' : 'muted')} ${paint(
        p.name,
        touched ? 'bold' : 'muted',
      )}`,
    )
    if (touched)
      line(`${count(p.changes.length, 'change')} / ${count(p.signals.files, 'file')}`, {
        indent: 15,
        tone: 'muted',
      })
  }
  for (const [key, p] of Object.entries(data)) {
    const s = p.signals
    if (!hasChanges(p) && !verbose) continue
    section(p.name)
    line(`npm ${p.npm_version} / develop ${p.local_version}`, { tone: 'muted' })
    if (verbose) {
      line(`Baseline: ${p.baseline} via ${p.baseline_source}`, { tone: 'muted' })
      line(`${PACKAGES[key].dir}/: ${count(s.files, 'file')}, ${s.generated_files} generated`, {
        tone: 'muted',
      })
    }
    if (p.changes.length) line('Changes', { tone: 'cyan' })
    for (const c of p.changes) {
      const ref = c.pr !== undefined ? `#${c.pr}` : c.commit
      const title = c.title && c.title !== '(gh unavailable)' ? c.title : c.subject
      line(`${ref} ${title}`, { indent: 4, prefix: '- ' })
      if (verbose) {
        const labels = c.labels?.length ? ` / ${c.labels.join(', ')}` : ''
        line(`${count(c.files, 'file')}, ${c.generated_files} generated${labels}`, {
          indent: 6,
          tone: 'muted',
        })
      }
    }
    if (!hasChanges(p)) line('No changes.', { tone: 'muted' })
    if (s.generated_files)
      line(`${count(s.generated_files, 'generated file')} changed.`, { indent: 4, tone: 'muted' })
    const signalList = (title, items, tone) => {
      if (!items.length) return
      line(`${title} (${items.length})`, { tone })
      for (const item of items) line(item, { indent: 4, prefix: '- ' })
    }
    if (s.removed_exports.length)
      signalList('Review breaking changes: removed hand-written exports', s.removed_exports, 'red')
    signalList('Added hand-written exports', s.added_exports, 'green')
    signalList(
      'Review breaking changes: generated API arguments removed or renamed',
      s.generated_changed_args,
      'red',
    )
    signalList(
      'Review breaking changes: generated API endpoints removed or renamed',
      s.generated_removed_endpoints,
      'red',
    )
    signalList('Added generated API endpoints', s.generated_added_endpoints, 'green')
    if (s.package_json_changes.length) {
      line('Package manifest changed', { tone: 'yellow' })
      if (verbose) {
        for (const l of s.package_json_changes)
          line(l, { indent: 4, tone: l.startsWith('+') ? 'green' : 'red' })
      }
    }
  }
  if (hasChanges(data.addon) || verbose) {
    section('Dependency notes')
    line(
      'Releasing addon also requires releases of shared and addon-dev: both pin its exact version.',
      { tone: 'yellow' },
    )
    line('addon-dev has only a peer range on shared, not a dependency on its code.', {
      tone: 'muted',
    })
  }
  if (changed.length && showNext)
    nextStep(
      'Use yarn release:start for the guided branch, bump, merge, build and publish workflow.',
    )
  if (!verbose)
    line('More detail: yarn release:changes --verbose. Machine-readable: --json.', {
      tone: 'muted',
    })
}

const cmdChanges = async (repo, opts) => {
  const data = collect(repo)
  if (opts.json) return console.log(JSON.stringify(data, null, 2))
  printChanges(data, { ...opts, showNext: !process.stdin.isTTY })
  if (
    process.stdin.isTTY &&
    Object.values(data).some((p) => hasChanges(p) || isPendingRelease(p)) &&
    (await confirm('Continue with the guided release?'))
  ) {
    await cmdStart(repo, opts, data)
  }
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Replace the value of "key": "..." (inside `section` when given), keeping the formatting
const subJsonString = (text, key, value, section) => {
  const replaceValue = (s) =>
    s.replace(new RegExp(`("${escapeRe(key)}":\\s*)"[^"]*"`), (_, pre) => `${pre}"${value}"`)
  if (section) {
    const m = text.match(new RegExp(`"${escapeRe(section)}":\\s*\\{[\\s\\S]*?\\n  \\}`))
    if (!m) return text
    return text.slice(0, m.index) + replaceValue(m[0]) + text.slice(m.index + m[0].length)
  }
  return text.replace(
    new RegExp(`^(  "${escapeRe(key)}":\\s*)"[^"]*"`, 'm'),
    (_, pre) => `${pre}"${value}"`,
  )
}

const arcRange = (repo) =>
  JSON.parse(readFileSync(path.join(repo, 'package.json'), 'utf8')).dependencies[ARC]

// Per package: [section, dependency, wanted value] for every pin this workflow keeps in step
const expected = (repo, versions) => {
  const arc = arcRange(repo)
  const a = versions.addon
  const s = versions.shared
  return {
    shared: [
      ['peerDependencies', '@ynput/ayon-addon', a],
      ['peerDependencies', ARC, arc],
    ],
    'addon-dev': [
      ['peerDependencies', '@ynput/ayon-addon', a],
      ['peerDependencies', PACKAGES.shared.name, `>=${s}`],
      ['peerDependencies', ARC, arc],
    ],
  }
}

const versionsOf = (repo) =>
  Object.fromEntries(Object.keys(PACKAGES).map((k) => [k, pkgJson(repo, k).version]))

const check = (repo) => {
  const versions = versionsOf(repo)
  const problems = []
  for (const [k, rows] of Object.entries(expected(repo, versions))) {
    const pj = pkgJson(repo, k)
    for (const [section, dep, value] of rows) {
      const have = pj[section]?.[dep]
      if (have !== value) {
        problems.push(
          `${PACKAGES[k].dir}/package.json ${section}.${dep} is ${JSON.stringify(
            have,
          )}, expected ${JSON.stringify(value)}`,
        )
      }
    }
  }
  const agents = path.join(repo, 'addon', 'AGENTS.md')
  if (existsSync(agents)) {
    const m = readFileSync(agents, 'utf8').match(/^# @ynput\/ayon-addon (\S+)/m)
    if (!m || m[1] !== versions.addon) {
      problems.push(
        `addon/AGENTS.md header says ${m ? m[1] : 'nothing'}, addon is ${versions.addon}`,
      )
    }
  }
  return problems
}

// `release:check` verifies that shared and addon-dev pin the current addon version, that
// addon-dev's shared peer range starts at the current shared version, and that ARC pins
// match the root package. It also checks the addon/AGENTS.md version header when present.
// It reports all inconsistencies and exits non-zero if any are found.
const cmdCheck = (repo) => {
  const problems = check(repo)
  printProblems(problems)
  process.exitCode = problems.length ? 1 : 0
}

// Read non-merge commits, not just merge subjects: conventional prefixes often live on
// commits inside a PR. Each package uses its own release baseline and highest bump level.
const suggestedBumps = (repo, releaseData) => {
  if (!releaseData) git(repo, 'fetch', '-q', 'origin')
  const suggestions = {}
  for (const key of PUBLISH_ORDER) {
    const base = releaseData ? releaseData[key].baseline : baseline(repo, key)[0]
    if (!base) die(`cannot find a release baseline for ${PACKAGES[key].name}`)
    const commits = git(
      repo,
      'log',
      '--no-merges',
      '--format=%B%x00',
      `${base}..${BASE}`,
      '--',
      PACKAGES[key].dir,
    )
      .split('\0')
      .map((message) => message.trim())
      .filter(Boolean)
    let level = 'none'
    let reason = 'no commits since the last release'
    for (const message of commits) {
      const subject = message.split('\n')[0]
      if (/^[a-z]+(?:\([^)]+\))?!: /i.test(subject) || /^BREAKING[ -]CHANGE:\s/m.test(message)) {
        level = 'major'
        reason = 'breaking-change commit'
        break
      }
      if (/^feat(?:\([^)]+\))?: /i.test(subject)) {
        level = 'minor'
        reason = 'feat commit'
      } else if (level === 'none') {
        level = 'patch'
        reason = /^fix(?:\([^)]+\))?: /i.test(subject) ? 'fix commit' : 'other package changes'
      }
    }
    suggestions[key] = { level, reason }
  }
  return suggestions
}

const promptBumps = async (repo, releaseData) => {
  if (!process.stdin.isTTY) {
    die('interactive bump needs a terminal; pass explicit <pkg>=<patch|minor|major|x.y.z> instead')
  }
  const suggestions = suggestedBumps(repo, releaseData)
  const versions = versionsOf(repo)
  const levels = {}
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    section('Review suggested version bumps')
    line('fix = patch / feat = minor / breaking change = major / other changes = patch', {
      tone: 'muted',
    })
    for (const key of PUBLISH_ORDER) {
      let { level, reason } = suggestions[key]
      if (releaseData) {
        const p = releaseData[key]
        const s = p.signals
        if (isPendingRelease(p)) {
          level = 'none'
          reason = `${p.local_version} is already newer than npm ${p.npm_version}; no extra bump needed`
        } else if (
          s.removed_exports.length ||
          s.generated_changed_args.length ||
          s.generated_removed_endpoints.length
        ) {
          level = 'major'
          reason = 'potentially breaking export or generated API changes; review before accepting'
        } else if (
          level !== 'major' &&
          (s.added_exports.length || s.generated_added_endpoints.length)
        ) {
          level = 'minor'
          reason = 'new hand-written exports or generated API endpoints'
        }
      }
      const pins = expected(repo, versions)[key] ?? []
      const pj = pkgJson(repo, key)
      const changedPins = pins.filter(([section, dep, value]) => pj[section]?.[dep] !== value)
      if (changedPins.length) {
        if (level === 'none') level = 'patch'
        reason += `; updated pins: ${changedPins.map(([, dep]) => dep).join(', ')}`
      }
      const current = versions[key]
      const target = level === 'none' ? current : bumped(current, level)
      section(PACKAGES[key].name)
      line(`${current} -> ${target} (${level})`, { tone: level === 'none' ? 'muted' : 'yellow' })
      line(reason, { tone: 'muted' })
      while (true) {
        const answer = (
          await rl.question(`Bump [${level}] (Enter to accept, patch/minor/major/x.y.z/none): `)
        ).trim()
        const choice = ['', 'y', 'yes'].includes(answer.toLowerCase()) ? level : answer
        if (choice !== 'none' && !/^(?:patch|minor|major|\d+\.\d+\.\d+)$/.test(choice)) {
          console.error('Choose patch, minor, major, x.y.z or none.')
          continue
        }
        if (choice !== 'none') {
          const next = bumped(current, choice)
          const npmVersion = releaseData?.[key].npm_version
          if (cmpSemver(next, current) <= 0 || (npmVersion && cmpSemver(next, npmVersion) <= 0)) {
            console.error(`Choose a version newer than ${current}, or none to skip.`)
            continue
          }
          levels[key] = choice
          versions[key] = next
        } else if (
          releaseData &&
          changedPins.length &&
          cmpSemver(current, releaseData[key].npm_version) <= 0
        ) {
          line('Dependency pins will change: this package needs a new version. Choose a bump.', {
            tone: 'yellow',
          })
          continue
        }
        break
      }
    }
    const items = Object.entries(levels).map(([key, level]) => `${key}=${level}`)
    if (!items.length) {
      line('No bumps selected; nothing changed.', { tone: 'muted' })
      return []
    }
    section('Selected versions')
    for (const key of Object.keys(levels))
      line(`${PACKAGES[key].name}: ${versions[key]}`, { tone: 'green' })
    const answer = await rl.question(
      'Apply these bumps, update dependency pins, commit and push? [Y/n] ',
    )
    if (!isConfirmed(answer)) {
      line('Aborted; nothing changed.', { tone: 'yellow' })
      return []
    }
    return items
  } finally {
    rl.close()
  }
}

// With no arguments, `release:bump` suggests versions from commits on origin/develop
// since each package's release baseline, then prompts for overrides and confirmation.
// Explicit pkg=level arguments retain the non-interactive workflow. Both modes update
// cross-package pins and the addon guide header, check consistency, then commit and push.
const cmdBump = async (repo, items, releaseData) => {
  const branch = git(repo, 'branch', '--show-current')
  if (!branch || branch === 'develop') {
    die(
      'bump commits and pushes: run it on a release branch, not develop or detached HEAD (git switch -c chore/release-packages-<date>, or a worktree)',
    )
  }
  if (git(repo, 'status', '--porcelain', '--', ...RELEASE_FILES)) {
    die('release files have existing changes: commit or stash those changes before bumping')
  }
  git(repo, 'remote', 'get-url', 'origin')
  if (!items.length) {
    items = await promptBumps(repo, releaseData)
    if (!items.length) return
  }
  const levels = {}
  for (const item of items) {
    const [k, lvl] = item.split('=')
    if (!Object.hasOwn(PACKAGES, k) || !lvl) {
      die(`expected <${Object.keys(PACKAGES).join('|')}>=<patch|minor|major|x.y.z>, got '${item}'`)
    }
    levels[k] = lvl
  }
  const versions = versionsOf(repo)
  for (const [k, lvl] of Object.entries(levels)) versions[k] = bumped(versions[k], lvl)
  if ('addon' in levels) {
    for (const dep of ['shared', 'addon-dev']) {
      if (!(dep in levels))
        console.error(
          paint(
            `WARNING  addon changes, but ${dep} pins it and is not bumped`,
            'yellow',
            process.stderr,
          ),
        )
    }
  }
  if ('shared' in levels && !('addon-dev' in levels)) {
    console.error(
      paint(
        'WARNING  addon-dev has a peer range on shared; bump it too if you want the floor moved',
        'yellow',
        process.stderr,
      ),
    )
  }
  const want = expected(repo, versions)
  if (releaseData) {
    for (const [key, pins] of Object.entries(want)) {
      const pj = pkgJson(repo, key)
      const changesPins = pins.some(
        ([section, dep, value]) => (key in levels || dep !== ARC) && pj[section]?.[dep] !== value,
      )
      if (changesPins && cmpSemver(versions[key], releaseData[key].npm_version) <= 0)
        die(
          `${key} needs a new version because its dependency pins will change; no files were written`,
        )
    }
  }
  const changedFiles = []
  const changedPackages = new Set()
  for (const k of Object.keys(PACKAGES)) {
    const file = path.join(repo, PACKAGES[k].dir, 'package.json')
    const text = readFileSync(file, 'utf8')
    let next = k in levels ? subJsonString(text, 'version', versions[k]) : text
    for (const [section, dep, value] of want[k] ?? []) {
      // untouched packages keep their ARC range: it only moves with a release of that package
      if (k in levels || dep !== ARC) next = subJsonString(next, dep, value, section)
    }
    if (next !== text) {
      writeFileSync(file, next)
      changedFiles.push(`${PACKAGES[k].dir}/package.json`)
      changedPackages.add(k)
      console.log(`${PACKAGES[k].dir}/package.json  ${versions[k]}`)
    }
  }
  const agents = path.join(repo, 'addon', 'AGENTS.md')
  if (existsSync(agents)) {
    const t = readFileSync(agents, 'utf8')
    const n = t.replace(/^# @ynput\/ayon-addon \S+/m, `# @ynput/ayon-addon ${versions.addon}`)
    if (n !== t) {
      writeFileSync(agents, n)
      changedFiles.push('addon/AGENTS.md')
      changedPackages.add('addon')
      console.log('addon/AGENTS.md  header')
    }
  }
  console.log()
  const problems = check(repo)
  printProblems(problems)
  if (problems.length) {
    process.exitCode = 1
    return
  }
  if (!changedFiles.length) {
    console.log('No release changes to commit or push.')
    return
  }
  git(
    repo,
    'commit',
    '--only',
    '-m',
    `chore: bump ${[...changedPackages].map((key) => `${key}@${versions[key]}`).join(', ')}`,
    '-m',
    'Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>',
    '--',
    ...changedFiles,
  )
  console.log('Committed release changes; pushing to origin.')
  git(repo, 'push', '--set-upstream', 'origin', `HEAD:refs/heads/${branch}`)
  section('Version bumps complete')
  line(`Committed and pushed release changes to origin/${branch}.`, { tone: 'green' })
  return versions
}

// `release:build` requires installed root dependencies and builds every publishable package.
// A failed build stops the release before publishing.
const cmdBuild = (repo) => {
  if (!existsSync(path.join(repo, 'node_modules'))) {
    die(`no node_modules in ${repo}: run yarn install --frozen-lockfile there`)
  }
  for (const script of ['build:addon', 'build:e2e']) {
    section(`BUILD  ${script}`)
    const r = spawnSync('yarn', [script], { cwd: repo, stdio: 'inherit' })
    if (r.status !== 0) die(`yarn ${script} failed: nothing was published`)
  }
  section('Build complete')
  line('All package builds passed.', { tone: 'green' })
}

// `release:publish` requires a clean checkout at exactly origin/develop and consistent
// package pins unless --force is supplied. It publishes only requested packages (or all
// packages) whose origin/develop version is newer than npm's, in dependency order, after
// one build and a confirmation unless --yes is used. --dry-run forwards npm's dry-run
// option; --otp forwards a one-time password to each npm publish.
const cmdPublish = async (repo, { packages, dryRun, yes, otp, force, expectedVersions }) => {
  git(repo, 'fetch', '-q', 'origin')
  const problems = []
  if (git(repo, 'status', '--porcelain')) problems.push('working tree is not clean')
  // equal, not just an ancestor: a checkout behind develop would publish the previous release's code
  if (git(repo, 'rev-parse', 'HEAD') !== git(repo, 'rev-parse', BASE)) {
    problems.push(
      `HEAD is not at ${BASE} (checkout is behind or on another commit): fast-forward develop (git pull --ff-only), ` +
        'or pass --repo of a worktree at develop',
    )
  }
  // reads the working tree, so only when it is the release commit
  if (!problems.some((p) => p.startsWith('HEAD'))) problems.push(...check(repo))
  if (problems.length && !force)
    die(`not publishing:\n  ${problems.join('\n  ')}\n(--force to ignore)`)

  if (expectedVersions) {
    for (const [key, version] of Object.entries(expectedVersions)) {
      if (pkgJson(repo, key, BASE).version !== version)
        die(`${PACKAGES[key].name} changed version after review; rerun release:start to review it`)
    }
  }

  const releaseHead = git(repo, 'rev-parse', 'HEAD')
  const keys = packages.length ? packages : PUBLISH_ORDER
  const todo = []
  for (const k of PUBLISH_ORDER) {
    if (!keys.includes(k)) continue
    const local = pkgJson(repo, k, BASE).version
    const npm = npmInfo(PACKAGES[k].name).version
    if (expectedVersions && !npm)
      die(
        `could not read the npm version of ${PACKAGES[k].name}; refusing to publish without a comparison`,
      )
    if (local !== npm && (npm === undefined || cmpSemver(local, npm) > 0)) todo.push([k, local])
    else line(`SKIP  ${PACKAGES[k].name} ${local}: npm has ${npm ?? 'nothing'}`, { tone: 'muted' })
  }
  if (!todo.length) {
    section('Nothing to publish')
    line('No selected package has a newer version than npm.', { tone: 'green' })
    return true
  }

  section(dryRun ? 'Publish plan (DRY RUN)' : 'Publish plan')
  for (const [k, v] of todo) line(`${PACKAGES[k].name}@${v}`, { prefix: '- ', tone: 'yellow' })
  line('Build first, then publish in dependency order.', { tone: 'muted' })
  if (!yes) {
    if (!(await confirm('Build these packages and continue?'))) {
      line('Stopped before building or publishing.', { tone: 'yellow' })
      return
    }
  }
  cmdBuild(repo)
  if (
    expectedVersions &&
    !(await confirm('Builds passed. Publish the listed versions to npm now?'))
  ) {
    line('Stopped after building; nothing was published. Rerun yarn release:start to continue.', {
      tone: 'yellow',
    })
    return
  }
  // npm login owns the terminal; no readline interface may remain open during this browser flow.
  if (!npmLoggedIn()) {
    if (!process.stdin.isTTY) die('not logged in to npm: run `npm login` first, then rerun')
    line('Not logged in to npm: starting npm login (approve it in the browser).', {
      tone: 'yellow',
    })
    const login = spawnSync('npm', ['login'], { stdio: 'inherit' })
    if (login.status !== 0 || !npmLoggedIn()) die('npm login did not finish: nothing was published')
  }
  git(repo, 'fetch', '-q', 'origin')
  if (!force) {
    if (
      git(repo, 'status', '--porcelain') ||
      git(repo, 'rev-parse', 'HEAD') !== releaseHead ||
      git(repo, 'rev-parse', BASE) !== releaseHead
    )
      die(
        'checkout or origin/develop changed during the build/login; nothing was published. Review and retry',
      )
    const buildProblems = check(repo)
    if (buildProblems.length)
      die(`release checks failed after building:\n${buildProblems.join('\n')}`)
  }
  for (const [k, v] of todo) {
    const args = [
      'publish',
      '--access',
      'public',
      ...(dryRun ? ['--dry-run'] : []),
      ...(otp ? ['--otp', otp] : []),
    ]
    section(`${dryRun ? 'DRY RUN' : 'PUBLISH'}  ${PACKAGES[k].name}@${v}`)
    line(`npm ${args.join(' ')}`, { tone: 'muted' })
    // stdio inherited: npm asks for the one-time password itself
    const r = spawnSync('npm', args, { cwd: path.join(repo, PACKAGES[k].dir), stdio: 'inherit' })
    if (r.status !== 0)
      die(`npm publish failed for ${PACKAGES[k].name}; packages before it were published`)
  }
  section(dryRun ? 'Dry run complete' : 'Publish complete')
  line(dryRun ? 'Nothing was published.' : `${count(todo.length, 'package')} published.`, {
    tone: 'green',
  })
  if (!dryRun && !expectedVersions) nextStep('yarn release:status')
  return !dryRun
}

const gh = (repo, ...args) => sh('gh', args, { cwd: repo })

const requireCleanTree = (repo) => {
  if (git(repo, 'status', '--porcelain'))
    die(
      'guided release needs a clean working tree; commit or stash your changes, then rerun yarn release:start',
    )
}

const releaseVersions = (repo, data) =>
  Object.fromEntries(
    PUBLISH_ORDER.map((key) => [key, pkgJson(repo, key).version]).filter(
      ([key, version]) => cmpSemver(version, data[key].npm_version) > 0,
    ),
  )

const releasePrBody = (repo, versions) => {
  const file = path.join(repo, '.github', 'pull_request_template.md')
  if (!existsSync(file)) die('release PR template is missing: .github/pull_request_template.md')
  const details = {
    'Description of changes': `Release npm packages:\n${Object.entries(versions)
      .map(([key, version]) => `- ${PACKAGES[key].name}: ${version}`)
      .join('\n')}`,
    'Technical details':
      'Updates package versions and cross-package dependency pins. Internal version/pin consistency checks: passed. Builds and npm publication: not run yet; the guided release builds the merged origin/develop checkout before publishing.',
    'Additional context':
      'Created by yarn release:start. Merge remains subject to GitHub checks and branch protections; publishing requires a separate CLI confirmation.',
  }
  let body = readFileSync(file, 'utf8')
  for (const [heading, text] of Object.entries(details)) {
    const pattern = new RegExp(`(^## ${escapeRe(heading)}[^\\n]*\\n)`, 'm')
    if (!pattern.test(body)) die(`release PR template is missing the "${heading}" section`)
    body = body.replace(pattern, (_, title) => `${title}\n${text}\n`)
  }
  return body
}

const mergeReleasePr = async (repo, url, head) => {
  const view = () =>
    JSON.parse(gh(repo, 'pr', 'view', url, '--json', 'state,headRefOid,baseRefName,mergeCommit'))
  let pr = view()
  while (pr.state !== 'MERGED') {
    if (pr.state !== 'OPEN') die(`release PR was closed without merging: ${url}`)
    if (pr.headRefOid !== head || pr.baseRefName !== 'develop')
      die('release PR head or target changed; stop and review it before continuing')
    line(url, { tone: 'cyan' })
    if (
      !(await confirm(
        'Merge this release PR into develop (respecting GitHub checks and protections)?',
      ))
    ) {
      line('Stopped before merging. Rerun yarn release:start on this branch to continue.', {
        tone: 'yellow',
      })
      return
    }
    const result = spawnSync('gh', ['pr', 'merge', url, '--merge', '--match-head-commit', head], {
      cwd: repo,
      stdio: 'inherit',
    })
    if (result.status !== 0) {
      line('Merge did not complete. Resolve the checks/reviews or error above, then retry here.', {
        tone: 'yellow',
      })
      if (!(await confirm('Retry the merge?'))) return
    } else {
      line(
        'Waiting for GitHub to confirm the PR is merged (including any merge queue). Ctrl+C stops safely.',
        { tone: 'muted' },
      )
      while (true) {
        pr = view()
        if (pr.state !== 'OPEN') break
        if (pr.headRefOid !== head || pr.baseRefName !== 'develop')
          die('release PR changed while waiting; review it before continuing')
        await setTimeout(10000)
      }
    }
    pr = view()
  }
  if (pr.headRefOid !== head || pr.baseRefName !== 'develop' || !pr.mergeCommit?.oid)
    die('merged PR does not match the reviewed release')
  return pr.mergeCommit.oid
}

const checkoutDevelop = (repo, mergeCommit) => {
  requireCleanTree(repo)
  git(repo, 'fetch', '-q', 'origin')
  if (mergeCommit && !gitOk(repo, 'merge-base', '--is-ancestor', mergeCommit, BASE))
    die('release merge is not in origin/develop yet; rerun yarn release:start after origin updates')
  if (gitOk(repo, 'show-ref', '--verify', '--quiet', 'refs/heads/develop')) {
    git(repo, 'switch', 'develop')
    git(repo, 'merge', '--ff-only', BASE)
  } else {
    git(repo, 'switch', '-c', 'develop', '--track', BASE)
  }
  if (git(repo, 'rev-parse', 'HEAD') !== git(repo, 'rev-parse', BASE))
    die(
      'local develop is ahead of or diverged from origin/develop; no build or publish was started',
    )
}

// Git and the PR are the resume state: no local state file, reset, forced merge or force-publish.
const cmdStart = async (repo, opts, reviewedData) => {
  if (!process.stdin.isTTY) die('release:start needs an interactive terminal')
  if (opts.json || opts.yes || opts.force || opts.dryRun || opts.positional.length)
    die(
      'release:start is interactive; use --verbose, --repo or --otp only (individual subcommands support automation/dry runs)',
    )
  section('Guided package release')
  line('1 Review changes  /  2 Branch and bump  /  3 Merge PR  /  4 Build  /  5 Publish', {
    tone: 'muted',
  })
  const data = reviewedData || collect(repo)
  if (!reviewedData) printChanges(data, { ...opts, showNext: false })
  for (const p of Object.values(data)) {
    if (p.npm_version === '?')
      die(`could not read the npm version of ${p.name}; retry once npm is available`)
  }
  const ready = Object.values(data).filter(isPendingRelease)
  if (ready.length) {
    section('Already versioned, not yet published')
    for (const p of ready)
      line(`${p.name}: npm ${p.npm_version} -> ${p.local_version}`, { tone: 'yellow' })
  }
  if (!Object.values(data).some((p) => hasChanges(p) || isPendingRelease(p))) {
    line('Nothing to release.', { tone: 'green' })
    return
  }
  if (!reviewedData && !(await confirm('Continue with this release?'))) return
  requireCleanTree(repo)
  gh(repo, 'auth', 'status')
  if (!existsSync(path.join(repo, 'node_modules')))
    die('root dependencies are missing; run yarn install --frozen-lockfile before releasing')

  let branch = git(repo, 'branch', '--show-current')
  let versions
  let mergeCommit
  const branchFiles = branch.startsWith(RELEASE_BRANCH_PREFIX)
    ? git(repo, 'diff', '--name-only', `${BASE}...HEAD`).split('\n').filter(Boolean)
    : []
  if (branchFiles.length) {
    if (branchFiles.some((file) => !RELEASE_FILES.includes(file)))
      die('release branch contains non-release changes; review it before continuing')
    versions = releaseVersions(repo, data)
    if (!Object.keys(versions).length) die('existing release branch has no versions newer than npm')
    for (const key of PUBLISH_ORDER) {
      if (branchFiles.includes(`${PACKAGES[key].dir}/package.json`) && !(key in versions))
        die(`${key} has release edits but no new version; review its bump before continuing`)
    }
    const problems = check(repo)
    printProblems(problems)
    if (problems.length) {
      process.exitCode = 1
      return
    }
    line(`Continuing existing release branch: ${branch}`, { tone: 'cyan' })
  } else if (Object.values(data).some((p) => hasChanges(p) && !isPendingRelease(p))) {
    branch = `${RELEASE_BRANCH_PREFIX}${new Date().toISOString().replace(/[:.]/g, '-')}`
    section('Create release branch')
    line(`${branch} from ${BASE}`, { tone: 'cyan' })
    if (!(await confirm('Create this branch and review version bumps?'))) return
    requireCleanTree(repo)
    git(repo, 'switch', '-c', branch, BASE)
    const bumpedVersions = await cmdBump(repo, [], data)
    if (!bumpedVersions) return
    versions = releaseVersions(repo, data)
  }

  if (versions) {
    section('Release pull request')
    const head = git(repo, 'rev-parse', 'HEAD')
    const prs = JSON.parse(
      gh(
        repo,
        'pr',
        'list',
        '--head',
        branch,
        '--base',
        'develop',
        '--state',
        'open',
        '--json',
        'url',
        '--limit',
        '1',
      ),
    )
    let url = prs[0]?.url
    if (!url) {
      if (!(await confirm('Push this branch and create the release PR?'))) return
      git(repo, 'push', '--set-upstream', 'origin', `HEAD:refs/heads/${branch}`)
      const title = `chore: release ${Object.entries(versions)
        .map(([key, version]) => `${key}@${version}`)
        .join(', ')}`
      url = gh(
        repo,
        'pr',
        'create',
        '--base',
        'develop',
        '--head',
        branch,
        '--title',
        title,
        '--body',
        releasePrBody(repo, versions),
      )
    }
    mergeCommit = await mergeReleasePr(repo, url, head)
    if (!mergeCommit) return
  } else {
    versions = Object.fromEntries(
      ready.map((p) => [
        PUBLISH_ORDER.find((key) => PACKAGES[key].name === p.name),
        p.local_version,
      ]),
    )
    section('Versions already merged')
    line('Continuing at the build/publish stage; no additional version bump or PR is needed.', {
      tone: 'green',
    })
  }

  section('Build merged release')
  if (!(await confirm('Switch to develop, fast-forward to origin/develop and continue?'))) return
  checkoutDevelop(repo, mergeCommit)
  const published = await cmdPublish(repo, {
    packages: Object.keys(versions),
    expectedVersions: versions,
    yes: false,
    force: false,
    dryRun: false,
    otp: opts.otp,
  })
  if (published) cmdStatus(repo)
}

// ----------------------------------------------------------------------------- cli
const USAGE = `usage: yarn release:<command> [options]

  start                         guided changes -> branch -> bump -> PR/merge -> build -> publish
                                confirms each stage; rerun to continue an existing release branch
                                requires a terminal, clean tree, gh login and root dependencies
                                uses GitHub merge commits and respects checks/branch protections
  status                        local origin/develop version vs npm, per package
  changes [--verbose|--json]    package summary, changes and bump signals since each last release
      --verbose                 include baselines, PR labels, file counts and manifest diffs
      --json                    full machine-readable data (unchanged; no colour)
  bump                          suggest bumps from commits; override, then confirm (Enter or y)
  bump <pkg>=<level> ...        set explicit versions and pins without prompts (patch|minor|major|x.y.z)
                                both modes commit and push to origin; require a release branch and clean release files
  check                         versions and pins consistent?
  build                         build:addon and build:e2e
  publish [pkg ...]             build, then npm publish what npm does not have yet (pkg: ${Object.keys(
    PACKAGES,
  ).join(', ')})
      --dry-run  --yes  --otp <code>  --force

  --repo <dir>                  another checkout or worktree (default: this one)

  Colour: yellow = changes/action, green = success/additions, red = errors/breaking signals.
  Dim text is supporting detail. NO_COLOR disables colour; FORCE_COLOR=1 enables it in pipes.
`

const parse = (argv) => {
  const cmd = argv.shift()
  const opts = {
    repo: ROOT,
    json: false,
    verbose: false,
    dryRun: false,
    yes: false,
    otp: undefined,
    force: false,
    positional: [],
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--repo') opts.repo = path.resolve(argv[++i] ?? die('--repo needs a directory'))
    else if (a === '--otp') opts.otp = argv[++i] ?? die('--otp needs a code')
    else if (a === '--json') opts.json = true
    else if (a === '--verbose') opts.verbose = true
    else if (a === '--dry-run') opts.dryRun = true
    else if (a === '--yes') opts.yes = true
    else if (a === '--force') opts.force = true
    else if (a === '-h' || a === '--help') return { cmd: undefined, opts }
    else opts.positional.push(a)
  }
  return { cmd, opts }
}

const { cmd, opts } = parse(process.argv.slice(2))
switch (cmd) {
  case 'start':
    await cmdStart(opts.repo, opts)
    break
  case 'status':
    cmdStatus(opts.repo)
    break
  case 'changes':
    await cmdChanges(opts.repo, opts)
    break
  case 'bump':
    await cmdBump(opts.repo, opts.positional)
    break
  case 'check':
    cmdCheck(opts.repo)
    break
  case 'build':
    cmdBuild(opts.repo)
    break
  case 'publish': {
    const bad = opts.positional.filter((p) => !Object.hasOwn(PACKAGES, p))
    if (bad.length)
      die(`unknown package(s): ${bad.join(', ')}; expected ${Object.keys(PACKAGES).join(', ')}`)
    await cmdPublish(opts.repo, { ...opts, packages: opts.positional })
    break
  }
  default:
    console.log(USAGE)
    process.exitCode = cmd ? 1 : 0
}

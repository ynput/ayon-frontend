#!/usr/bin/env node
// Release helper for the npm packages published from this repo:
//   @ynput/ayon-addon            addon/
//   @ynput/ayon-frontend-shared  shared/
//   @ynput/ayon-addon-dev        addon-dev/
//   @ynput/ayon-e2e              e2e/
//
// Run from the repo root through yarn (the release:* scripts in package.json):
//   yarn release:status                     local origin/develop version vs npm, per package
//   yarn release:changes [--json]           what merged since each package's last npm release, and the
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
// status, changes, interactive bump and publish fetch origin.
// bump needs clean release files and an origin remote; it pushes the current release branch.
// publish needs HEAD at origin/develop, a clean tree and npm login.
//
// The skill that runs the whole release (PR, versions, hand-over) lives in the AYON dev workbench:
// .claude/skills/release-packages/SKILL.md.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline/promises'

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

const die = (msg) => {
  console.error(msg)
  process.exit(1)
}

const isConfirmed = (answer) => ['', 'y'].includes(answer.trim().toLowerCase())

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
  console.log(`local = ${BASE}`)
  for (const key of PUBLISH_ORDER) {
    const local = pkgJson(repo, key, BASE).version
    const npm = npmInfo(PACKAGES[key].name).version ?? '?'
    const state = local === npm ? 'published' : local !== '?' && local !== npm ? 'NOT on npm' : ''
    console.log(
      `${PACKAGES[key].name.padEnd(32)} local ${local.padEnd(8)} npm ${npm.padEnd(8)} ${state}`,
    )
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

const cmdChanges = (repo, asJson) => {
  const data = collect(repo)
  if (asJson) return console.log(JSON.stringify(data, null, 2))
  for (const [key, p] of Object.entries(data)) {
    const s = p.signals
    console.log(`\n## ${p.name}  (npm ${p.npm_version}, local ${p.local_version})`)
    console.log(
      `baseline ${p.baseline} via ${p.baseline_source}; ${p.changes.length} merge(s) touching ${PACKAGES[key].dir}/, ` +
        `${s.files} files (${s.generated_files} generated)`,
    )
    for (const c of p.changes) {
      const label = c.labels?.length ? ` [${c.labels.join(', ')}]` : ''
      const ref = c.pr !== undefined ? `#${c.pr}` : c.commit
      console.log(
        `  - ${ref} ${c.title || c.subject}${label}  (${c.files} files, ${
          c.generated_files
        } generated)`,
      )
    }
    if (!p.changes.length) console.log("  (nothing touched this package's directory)")
    if (s.removed_exports.length)
      console.log(`  removed exports (hand-written): ${s.removed_exports.join(', ')}`)
    if (s.added_exports.length) {
      const a = s.added_exports
      console.log(
        `  added exports (hand-written): ${a.slice(0, 40).join(', ')}${
          a.length > 40 ? ' ...' : ''
        }`,
      )
    }
    if (s.generated_changed_args.length) {
      console.log(
        '  generated API: endpoints whose argument props were removed or renamed (breaking for callers):',
      )
      for (const c of s.generated_changed_args) console.log(`    ${c}`)
    }
    if (s.generated_removed_endpoints.length) {
      console.log(
        `  generated API: endpoints removed or renamed: ${s.generated_removed_endpoints.join(
          ', ',
        )}`,
      )
    }
    if (s.generated_added_endpoints.length) {
      console.log(`  generated API: endpoints added: ${s.generated_added_endpoints.join(', ')}`)
    }
    if (s.package_json_changes.length) {
      console.log('  package.json changes since the release:')
      for (const l of s.package_json_changes) console.log(`    ${l}`)
    }
  }
  console.log(
    '\nPins: addon is pinned exactly by shared and addon-dev (peerDependencies), so a new addon version needs a ' +
      'release of both. addon-dev has no dependency on shared code, only a peer range.',
  )
  console.log(
    'Next: run yarn release:bump in a release branch to review suggested bumps, or pass explicit addon=minor ... overrides.',
  )
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
  console.log(problems.length ? problems.join('\n') : 'consistent')
  process.exitCode = problems.length ? 1 : 0
}

// Read non-merge commits, not just merge subjects: conventional prefixes often live on
// commits inside a PR. Each package uses its own release baseline and highest bump level.
const suggestedBumps = (repo) => {
  git(repo, 'fetch', '-q', 'origin')
  const suggestions = {}
  for (const key of PUBLISH_ORDER) {
    const [base] = baseline(repo, key)
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

const promptBumps = async (repo) => {
  if (!process.stdin.isTTY) {
    die('interactive bump needs a terminal; pass explicit <pkg>=<patch|minor|major|x.y.z> instead')
  }
  const suggestions = suggestedBumps(repo)
  const versions = versionsOf(repo)
  const levels = {}
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    console.log(
      'Suggestions: fix = patch, feat = minor, breaking change = major, other changes = patch.',
    )
    for (const key of PUBLISH_ORDER) {
      let { level, reason } = suggestions[key]
      const pins = expected(repo, versions)[key] ?? []
      const pj = pkgJson(repo, key)
      const changedPins = pins.filter(([section, dep, value]) => pj[section]?.[dep] !== value)
      if (changedPins.length) {
        if (level === 'none') level = 'patch'
        reason += `; updated pins: ${changedPins.map(([, dep]) => dep).join(', ')}`
      }
      const current = versions[key]
      const target = level === 'none' ? current : bumped(current, level)
      console.log(`\n${PACKAGES[key].name}: ${current} -> ${target} (${level}; ${reason})`)
      while (true) {
        const answer = (
          await rl.question(`Bump [${level}] (Enter to accept, patch/minor/major/x.y.z/none): `)
        ).trim()
        const choice = answer || level
        if (choice !== 'none' && !/^(?:patch|minor|major|\d+\.\d+\.\d+)$/.test(choice)) {
          console.error('Choose patch, minor, major, x.y.z or none.')
          continue
        }
        if (choice !== 'none') {
          const next = bumped(current, choice)
          if (cmpSemver(next, current) <= 0) {
            console.error(`Choose a version newer than ${current}, or none to skip.`)
            continue
          }
          levels[key] = choice
          versions[key] = next
        }
        break
      }
    }
    const items = Object.entries(levels).map(([key, level]) => `${key}=${level}`)
    if (!items.length) {
      console.log('No bumps selected; nothing changed.')
      return []
    }
    console.log('\nSelected versions:')
    for (const key of Object.keys(levels)) console.log(`  ${PACKAGES[key].name}: ${versions[key]}`)
    const answer = await rl.question('Apply these bumps, update dependency pins, commit and push? [Y/n] ')
    if (!isConfirmed(answer)) {
      console.log('Aborted; nothing changed.')
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
const cmdBump = async (repo, items) => {
  const branch = git(repo, 'branch', '--show-current')
  if (!branch || branch === 'develop') {
    die(
      'bump commits and pushes: run it on a release branch, not develop or detached HEAD (git switch -c chore/release-packages-<date>, or a worktree)',
    )
  }
  const releaseFiles = [
    ...Object.values(PACKAGES).map(({ dir }) => `${dir}/package.json`),
    'addon/AGENTS.md',
  ]
  if (git(repo, 'status', '--porcelain', '--', ...releaseFiles)) {
    die('release files have existing changes: commit or stash those changes before bumping')
  }
  git(repo, 'remote', 'get-url', 'origin')
  if (!items.length) {
    items = await promptBumps(repo)
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
        console.error(`warning: addon changes, but ${dep} pins it and is not bumped`)
    }
  }
  if ('shared' in levels && !('addon-dev' in levels)) {
    console.error(
      'warning: addon-dev has a peer range on shared; bump it too if you want the floor moved',
    )
  }
  const want = expected(repo, versions)
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
  console.log(problems.length ? problems.join('\n') : 'consistent')
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
  console.log(`Pushed release changes to origin/${branch}.`)
}

// `release:build` requires installed root dependencies and builds every publishable package.
// A failed build stops the release before publishing.
const cmdBuild = (repo) => {
  if (!existsSync(path.join(repo, 'node_modules'))) {
    die(`no node_modules in ${repo}: run yarn install --frozen-lockfile there`)
  }
  for (const script of ['build:addon', 'build:e2e']) {
    const r = spawnSync('yarn', [script], { cwd: repo, stdio: 'inherit' })
    if (r.status !== 0) die(`yarn ${script} failed: nothing was published`)
  }
}

// `release:publish` requires a clean checkout at exactly origin/develop and consistent
// package pins unless --force is supplied. It publishes only requested packages (or all
// packages) whose origin/develop version is newer than npm's, in dependency order, after
// one build and a confirmation unless --yes is used. --dry-run forwards npm's dry-run
// option; --otp forwards a one-time password to each npm publish.
const cmdPublish = async (repo, { packages, dryRun, yes, otp, force }) => {
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

  // npm login is a browser flow: run it here, in the terminal, once the other checks have passed
  if (!npmLoggedIn()) {
    if (!process.stdin.isTTY) die('not logged in to npm: run `npm login` first, then rerun')
    console.log('not logged in to npm: starting npm login (approve it in the browser)\n')
    spawnSync('npm', ['login'], { stdio: 'inherit' })
    if (!npmLoggedIn()) die('npm login did not finish: nothing was published')
  }

  const keys = packages.length ? packages : PUBLISH_ORDER
  const todo = []
  for (const k of PUBLISH_ORDER) {
    if (!keys.includes(k)) continue
    const local = pkgJson(repo, k, BASE).version
    const npm = npmInfo(PACKAGES[k].name).version
    if (local !== npm && (npm === undefined || cmpSemver(local, npm) > 0)) todo.push([k, local])
    else console.log(`skip ${PACKAGES[k].name} ${local}: npm has ${npm ?? 'nothing'}`)
  }
  if (!todo.length) return

  console.log(
    `will build, then publish: ${todo.map(([k, v]) => `${PACKAGES[k].name}@${v}`).join(', ')}`,
  )
  if (!yes) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question('continue? [Y/n] ')
    rl.close()
    if (!isConfirmed(answer)) die('aborted')
  }
  cmdBuild(repo)
  for (const [k, v] of todo) {
    const args = [
      'publish',
      '--access',
      'public',
      ...(dryRun ? ['--dry-run'] : []),
      ...(otp ? ['--otp', otp] : []),
    ]
    console.log(`\n== ${PACKAGES[k].name}@${v}: npm ${args.join(' ')}`)
    // stdio inherited: npm asks for the one-time password itself
    const r = spawnSync('npm', args, { cwd: path.join(repo, PACKAGES[k].dir), stdio: 'inherit' })
    if (r.status !== 0)
      die(`npm publish failed for ${PACKAGES[k].name}; packages before it were published`)
  }
  if (!dryRun) console.log('\npublished. Check: yarn release:status')
}

// ----------------------------------------------------------------------------- cli
const USAGE = `usage: yarn release:<command> [options]

  status                        local origin/develop version vs npm, per package
  changes [--json]              what merged since each package's last release, and the signals for the bump
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
`

const parse = (argv) => {
  const cmd = argv.shift()
  const opts = {
    repo: ROOT,
    json: false,
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
  case 'status':
    cmdStatus(opts.repo)
    break
  case 'changes':
    cmdChanges(opts.repo, opts.json)
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

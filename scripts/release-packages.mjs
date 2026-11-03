#!/usr/bin/env node
// Release helper for the npm packages published from this repo:
//   @ynput/ayon-addon            addon/
//   @ynput/ayon-frontend-shared  shared/
//   @ynput/ayon-addon-dev        addon-dev/
//
// Run from the repo root through yarn (the release:* scripts in package.json):
//   yarn release:status                     local origin/develop version vs npm, per package
//   yarn release:changes [--json]           what merged since each package's last npm release, and the
//                                           signals that decide patch / minor / major
//   yarn release:bump <pkg>=<level> ...     set versions and cross-package pins; <level> is patch, minor,
//                                           major or x.y.z. Run on a release branch, never on develop.
//   yarn release:check                      are versions and cross-package pins consistent?
//   yarn release:build                      yarn build:addon (shared, addon, addon-dev)
//   yarn release:publish [pkg ...] [--dry-run] [--yes] [--otp <code>] [--force]
//                                           build, then npm publish what npm does not have yet, in order
//
// --repo <dir> runs a command against another checkout or worktree (default: this repo).
// status, changes and publish fetch origin; publish needs HEAD at origin/develop, a clean tree and npm login.
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
}
const PUBLISH_ORDER = ['addon', 'shared', 'addon-dev']
const ARC = '@ynput/ayon-react-components'
const BASE = 'origin/develop'
// generated from the backend's OpenAPI / GraphQL: kept apart from hand-written code when reading diffs
const GENERATED = /\/generated\/|\.graphql\.|graphql\.schema/

const die = (msg) => {
  console.error(msg)
  process.exit(1)
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

// ----------------------------------------------------------------------------- status
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

// ----------------------------------------------------------------------------- changes
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
    'Next: decide patch/minor/major per package (SKILL.md), then yarn release:bump addon=minor ... in a release branch.',
  )
}

// ----------------------------------------------------------------------------- bump / check
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

const cmdCheck = (repo) => {
  const problems = check(repo)
  console.log(problems.length ? problems.join('\n') : 'consistent')
  process.exitCode = problems.length ? 1 : 0
}

const cmdBump = (repo, items) => {
  if (git(repo, 'branch', '--show-current') === 'develop') {
    die(
      'bump changes files: run it on a release branch, not develop (git switch -c chore/release-packages-<date>, or a worktree)',
    )
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
      console.log(`${PACKAGES[k].dir}/package.json  ${versions[k]}`)
    }
  }
  const agents = path.join(repo, 'addon', 'AGENTS.md')
  if (existsSync(agents)) {
    const t = readFileSync(agents, 'utf8')
    const n = t.replace(/^# @ynput\/ayon-addon \S+/m, `# @ynput/ayon-addon ${versions.addon}`)
    if (n !== t) {
      writeFileSync(agents, n)
      console.log('addon/AGENTS.md  header')
    }
  }
  console.log()
  const problems = check(repo)
  console.log(problems.length ? problems.join('\n') : 'consistent')
  process.exitCode = problems.length ? 1 : 0
}

// ----------------------------------------------------------------------------- build / publish
const cmdBuild = (repo) => {
  if (!existsSync(path.join(repo, 'node_modules'))) {
    die(`no node_modules in ${repo}: run yarn install --frozen-lockfile there`)
  }
  const r = spawnSync('yarn', ['build:addon'], { cwd: repo, stdio: 'inherit' })
  if (r.status !== 0) die('yarn build:addon failed: nothing was published')
}

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
  if (!npmLoggedIn()) problems.push('not logged in to npm: `npm login`')
  if (problems.length && !force)
    die(`not publishing:\n  ${problems.join('\n  ')}\n(--force to ignore)`)

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
    const answer = await rl.question('continue? [y/N] ')
    rl.close()
    if (answer.trim().toLowerCase() !== 'y') die('aborted')
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
  bump <pkg>=<level> ...        set versions and pins (patch|minor|major|x.y.z), on a release branch
  check                         versions and pins consistent?
  build                         yarn build:addon
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
    if (!opts.positional.length) die('bump needs at least one <pkg>=<level>')
    cmdBump(opts.repo, opts.positional)
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

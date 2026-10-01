/**
 * A short label for a link to a well known site, made only from the url (nothing is fetched),
 * e.g. `https://github.com/ynput/ayon-frontend/issues/2342` → `ayon-frontend #2342`.
 * Returns null for urls without a known structure, which keep the url as their text.
 */

type LabelParser = (url: URL, parts: string[]) => string | null

const decode = (value: string) => {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return value
  }
}

// `fix-the-column-resize` → `Fix the column resize`
const fromSlug = (slug?: string) => {
  const text = decode(slug || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

const shortSha = (sha: string) => sha.slice(0, 7)

// `#L10` / `#L10-L20` → `:10` / `:10-20`
const lineSuffix = (hash: string) => {
  const match = hash.match(/^#L(\d+)(?:C\d+)?(?:-L(\d+))?/)
  if (!match) return ''
  return match[2] ? `:${match[1]}-${match[2]}` : `:${match[1]}`
}

const fileName = (path: string[]) => decode(path[path.length - 1] || '')

// github pages that aren't an owner / repo
const GITHUB_RESERVED = new Set([
  'about',
  'apps',
  'collections',
  'enterprise',
  'explore',
  'features',
  'issues',
  'login',
  'marketplace',
  'new',
  'notifications',
  'orgs',
  'organizations',
  'pricing',
  'pulls',
  'search',
  'settings',
  'sponsors',
  'topics',
  'trending',
])

// github.com/{owner}/{repo}/...
const github: LabelParser = (url, parts) => {
  const [owner, repo, kind, ...rest] = parts
  if (!owner || GITHUB_RESERVED.has(owner)) return null
  if (!repo) return owner
  switch (kind) {
    case undefined:
      return `${owner}/${repo}`
    case 'issues':
    case 'pull':
    case 'discussions':
      return /^\d+$/.test(rest[0] || '') ? `${repo} #${rest[0]}` : `${repo} ${kind}`
    case 'commit':
      return rest[0] ? `${repo}@${shortSha(rest[0])}` : null
    case 'compare':
      return rest.length ? `${repo} ${decode(rest.join('/'))}` : null
    case 'releases':
      return rest[0] === 'tag' && rest[1] ? `${repo} ${decode(rest[1])}` : `${repo} releases`
    case 'tree':
    case 'blob': {
      // {ref}/{path...}, the ref is usually one segment
      const path = rest.slice(1)
      if (!path.length) return rest[0] ? `${repo}@${decode(rest[0])}` : null
      return `${repo}/${fileName(path)}${lineSuffix(url.hash)}`
    }
    case 'actions':
      return rest[0] === 'runs' && rest[1] ? `${repo} run ${rest[1]}` : `${repo} actions`
    case 'wiki':
      return rest[0] ? `${repo} wiki: ${fromSlug(rest[0])}` : `${repo} wiki`
    default:
      return null
  }
}

// gitlab.com/{group}/{project}/-/{kind}/...
const gitlab: LabelParser = (url, parts) => {
  const dash = parts.indexOf('-')
  if (dash < 2) return parts.length >= 2 ? parts[parts.length - 1] : null
  const repo = parts[dash - 1]
  const [kind, id, ...rest] = parts.slice(dash + 1)
  switch (kind) {
    case 'issues':
      return id ? `${repo} #${id}` : `${repo} issues`
    case 'merge_requests':
      return id ? `${repo} !${id}` : `${repo} merge requests`
    case 'commit':
      return id ? `${repo}@${shortSha(id)}` : null
    case 'tags':
    case 'releases':
      return id ? `${repo} ${decode(id)}` : null
    case 'blob':
    case 'tree':
      return rest.length ? `${repo}/${fileName(rest)}${lineSuffix(url.hash)}` : null
    case 'pipelines':
      return id ? `${repo} pipeline ${id}` : null
    default:
      return null
  }
}

// bitbucket.org/{workspace}/{repo}/...
const bitbucket: LabelParser = (_url, parts) => {
  const [, repo, kind, id] = parts
  if (!repo) return null
  if (kind === 'pull-requests' && id) return `${repo} #${id}`
  if (kind === 'issues' && id) return `${repo} #${id}`
  if (kind === 'commits' && id) return `${repo}@${shortSha(id)}`
  return kind ? null : repo
}

const JIRA_KEY = /^[A-Z][A-Z0-9_]+-\d+$/

// {site}.atlassian.net: jira issues and confluence pages
const atlassian: LabelParser = (url, parts) => {
  // jira: /browse/KEY-1, board urls with ?selectedIssue=KEY-1
  const issue = parts.find((part) => JIRA_KEY.test(part)) || url.searchParams.get('selectedIssue')
  if (issue && JIRA_KEY.test(issue)) return issue
  // confluence: /wiki/spaces/{space}/pages/{id}/{Title+Of+Page}
  if (parts[0] === 'wiki') {
    const pages = parts.indexOf('pages')
    const title = pages >= 0 ? parts[pages + 2] : undefined
    if (title) return decode(title)
    if (parts[1] === 'spaces' && parts[2]) return `${parts[2]} space`
  }
  return null
}

// linear.app/{team}/issue/{KEY-1}/{title-slug}
const linear: LabelParser = (_url, parts) => {
  const [, kind, id, slug] = parts
  if (kind === 'issue' && id) return slug ? `${id} ${fromSlug(slug)}` : id
  if (kind === 'project' && id) return fromSlug(id.replace(/-[0-9a-f]{8,}$/, ''))
  return null
}

// notion.so/{workspace}/{Page-Title-<32 hex id>}
const notion: LabelParser = (_url, parts) => {
  const page = parts[parts.length - 1]
  const title = page?.replace(/-?[0-9a-f]{32}$/i, '')
  return title ? fromSlug(title) : null
}

// figma.com/{file|design|proto|board}/{key}/{File-Name}
const figma: LabelParser = (_url, parts) => {
  const [kind, , name] = parts
  if (!['file', 'design', 'proto', 'board', 'slides'].includes(kind || '')) return null
  return name ? `${decode(name).replace(/-/g, ' ')} (Figma)` : null
}

// trello.com/c/{id}/{123-card-name}, trello.com/b/{id}/{board-name}
const trello: LabelParser = (_url, parts) => {
  const [kind, , slug] = parts
  if (!slug || !['c', 'b'].includes(kind || '')) return null
  return fromSlug(kind === 'c' ? slug.replace(/^\d+-/, '') : slug)
}

// ShotGrid / Flow Production Tracking: /detail/{Type}/{id}, or #{Type}_{id} on pages
const shotgrid: LabelParser = (url, parts) => {
  const detail = parts.indexOf('detail')
  if (detail >= 0 && parts[detail + 1] && /^\d+$/.test(parts[detail + 2] || '')) {
    return `${decode(parts[detail + 1]).replace(/_/g, ' ')} ${parts[detail + 2]}`
  }
  const hash = url.hash.match(/^#([A-Za-z]+(?:_[A-Za-z]+)*)_(\d+)/)
  if (hash) return `${hash[1].replace(/_/g, ' ')} ${hash[2]}`
  return null
}

// stackoverflow.com/questions/{id}/{title-slug}
const stackoverflow: LabelParser = (_url, parts) =>
  parts[0] === 'questions' && parts[2] ? fromSlug(parts[2]) : null

// discourse forums (e.g. community.ynput.io): /t/{title-slug}/{id}
const discourse: LabelParser = (_url, parts) =>
  parts[0] === 't' && parts[1] && !/^\d+$/.test(parts[1]) ? fromSlug(parts[1]) : null

const GOOGLE_DOC_TYPES: Record<string, string> = {
  document: 'Google Doc',
  spreadsheets: 'Google Sheet',
  presentation: 'Google Slides',
  forms: 'Google Form',
  drawings: 'Google Drawing',
}

// docs.google.com/{type}/d/{id}, drive.google.com/drive/folders/{id}
const google: LabelParser = (url, parts) => {
  if (url.hostname === 'docs.google.com') return GOOGLE_DOC_TYPES[parts[0]] ?? null
  if (parts.includes('folders')) return 'Google Drive folder'
  if (parts[0] === 'file') return 'Google Drive file'
  return null
}

// dropbox.com/scl/fi/{id}/{file.ext}, dropbox.com/s/{id}/{file.ext}
const dropbox: LabelParser = (_url, parts) => {
  const name = parts[parts.length - 1]
  return parts.length >= 3 && name?.includes('.') ? decode(name) : null
}

// hostname (exact or a subdomain of it) → parser
const PARSERS: [RegExp, LabelParser][] = [
  [/^(www\.)?github\.com$/, github],
  [/^(www\.)?gitlab\.com$|^gitlab\./, gitlab],
  [/^(www\.)?bitbucket\.org$/, bitbucket],
  [/\.atlassian\.net$/, atlassian],
  [/^(www\.)?linear\.app$/, linear],
  [/^(www\.)?notion\.so$|\.notion\.site$/, notion],
  [/^(www\.)?figma\.com$/, figma],
  [/^(www\.)?trello\.com$/, trello],
  [/\.shotgrid\.autodesk\.com$|\.shotgunstudio\.com$/, shotgrid],
  [/^(www\.)?stackoverflow\.com$/, stackoverflow],
  [/^community\.ynput\.io$|^(forum|forums|community|discourse)\./, discourse],
  [/^(docs|drive)\.google\.com$/, google],
  [/^(www\.)?dropbox\.com$/, dropbox],
]

export const getLinkLabel = (href: string): string | null => {
  let url: URL
  try {
    url = new URL(href.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const hostname = url.hostname.toLowerCase()
  const parser = PARSERS.find(([host]) => host.test(hostname))?.[1]
  if (!parser) return null

  const parts = url.pathname.split('/').filter(Boolean)
  const label = parser(url, parts)?.replace(/[[\]]/g, '').trim()
  return label || null
}

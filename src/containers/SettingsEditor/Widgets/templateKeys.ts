// Template values ("{root[work]}/{folder[name]}<_{variant}>.{ext}") split into parts to
// colour. Keys are coloured by depth (a key, its sub-key, deeper sub-keys), so dict
// lookups like {user[attrib][email]} read as a path; punctuation, format specs and
// separators between literal words are dimmed; "<" and ">" mark optional parts
export type TemplatePartKind =
  | 'text'
  | 'separator'
  | 'mark'
  | 'optional'
  | 'key-0'
  | 'key-1'
  | 'key-2'

export type TemplatePart = {
  text: string
  kind: TemplatePartKind
  /** Where the part starts in the value */
  start: number
}

// Sub-keys deeper than this share the last colour
const MAX_KEY_LEVEL = 2

// literal text outside keys: letters, digits and spaces; anything else is a separator
const WORD_CHAR = /[\p{L}\p{N} ]/u
const isWordChar = (char: string) => WORD_CHAR.test(char)

type OpenKey = {
  /** Lookups so far: the key itself is 0, its first [sub-key] 1, the next 2 */
  level: number
  /** Past the colon: the rest is a format spec */
  inFormat: boolean
}

/**
 * Splits a value into template parts. Keys nest ("{frame:0>{@frame_padding}}"), and
 * each nested key starts again at the top level. "@" opens a reference to another
 * template. A key left open while typing colours the rest of the value as a key.
 */
export const splitTemplateKeys = (value: string): TemplatePart[] => {
  const parts: TemplatePart[] = []
  let offset = 0
  const push = (text: string, kind: TemplatePartKind) => {
    const last = parts[parts.length - 1]
    if (last?.kind === kind) last.text += text
    else parts.push({ text, kind, start: offset })
    offset += text.length
  }

  const openKeys: OpenKey[] = []
  for (const char of value) {
    const key = openKeys[openKeys.length - 1]
    if (char === '{') {
      openKeys.push({ level: 0, inFormat: false })
      push(char, 'mark')
    } else if (!key) {
      if (char === '<' || char === '>') push(char, 'optional')
      else push(char, isWordChar(char) ? 'text' : 'separator')
    } else if (char === '}') {
      openKeys.pop()
      push(char, 'mark')
    } else if (key.inFormat || char === '@') {
      push(char, 'mark')
    } else if (char === ':') {
      key.inFormat = true
      push(char, 'mark')
    } else if (char === '[') {
      key.level += 1
      push(char, 'mark')
    } else if (char === ']') {
      push(char, 'mark')
    } else {
      push(char, `key-${Math.min(key.level, MAX_KEY_LEVEL)}` as TemplatePartKind)
    }
  }
  return parts
}

export const hasTemplateKeys = (parts: TemplatePart[]) =>
  parts.some((part) => part.kind.startsWith('key-'))

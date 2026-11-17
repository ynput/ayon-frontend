// JSON in the raw settings dialogs: laid out with 2 spaces, as the editor's Tab key indents
export const toJson = (value: unknown) => JSON.stringify(value ?? null, null, 2)

export type ParsedJson =
  | { value: unknown; error?: undefined }
  | { value?: undefined; error: string }

export const parseJson = (code: string): ParsedJson => {
  try {
    return { value: JSON.parse(code) }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

// what a settings value is, as the dialogs name it to the user
const getJsonKind = (value: unknown) => {
  if (value === null || value === undefined) return 'null'
  if (Array.isArray(value)) return 'list'
  if (typeof value === 'object') return 'group'
  return typeof value
}

const KIND_LABELS: Record<string, string> = {
  list: 'a list',
  group: 'a group of settings',
  string: 'text',
  number: 'a number',
  boolean: 'true or false',
}

/**
 * Why a value can't replace the one it was edited from: it parses, but isn't of the same kind
 * (a group typed as a list, or emptied to null). The form would draw such a value as empty,
 * and save it as it is. A value that was empty takes any kind
 */
export const getKindMismatch = (original: unknown, value: unknown) => {
  const expected = getJsonKind(original)
  if (expected === 'null' || getJsonKind(value) === expected) return undefined
  return `Incompatible data structure: expected ${KIND_LABELS[expected] ?? expected}`
}

/** The message under the editor: the JSON doesn't parse, or isn't of the original's kind */
export const getJsonProblem = (parsed: ParsedJson, original: unknown) =>
  parsed.error !== undefined
    ? `Invalid JSON: ${parsed.error}`
    : getKindMismatch(original, parsed.value)

// taller and wider than a large dialog's 500px: settings run long
export const JSON_DIALOG_STYLE = {
  width: 'min(960px, 90vw)',
  maxWidth: '90vw',
  height: 'min(900px, 85vh)',
  maxHeight: '85vh',
}

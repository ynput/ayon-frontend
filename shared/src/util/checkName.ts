import { snakeCase } from 'lodash'

export interface CheckNameResult {
  valid: boolean
  error?: string
}

export type NamingConfig = {
  capitalization?: 'lower' | 'upper' | 'keep' | 'pascal' | 'camel'
  separator?: '' | '_' | '-' | '.'
}

// Validation ONLY: does not mutate/transform name. Returns validity + human readable error.
export const checkName = (name?: string | null): CheckNameResult => {
  if (!name) return { valid: false, error: 'Name is required' }
  if (/\s/.test(name)) return { valid: false, error: 'Spaces are not allowed' }

  // Allowed char set (underscore, dash, dot included)
  const allowed = /^[a-zA-Z0-9_\.\-]+$/
  if (!allowed.test(name)) {
    return { valid: false, error: 'Only letters, numbers, underscores, dashes and dots allowed' }
  }

  // Leading/trailing dot or dash not allowed; underscore IS allowed
  if (/^[.-]/.test(name)) return { valid: false, error: 'Cannot start with dot or dash' }
  if (/[.-]$/.test(name)) return { valid: false, error: 'Cannot end with dot or dash' }

  return { valid: true }
}

// Formatting + validation helper replacing old behavior of checkName.
// It will sanitize and then apply capitalization + separator rules.
export const parseAndFormatName = (
  raw: string,
  config: NamingConfig = { capitalization: 'lower', separator: '' },
): string => {
  const { capitalization = 'lower', separator = '' } = config

  if (!raw) return ''

  // trim and split by whitespace first to preserve word boundaries
  let working = raw.trim()
  const parts = working.split(/\s+/).filter(Boolean)

  // Remove disallowed characters from each part
  const cleanedParts = parts
    .map((part) => {
      // Remove disallowed characters, keep _, -, .
      let cleaned = part.replace(/[^a-zA-Z0-9_\-\.]+/g, '')
      // Remove trailing - or .
      cleaned = cleaned.replace(/[.-]+$/g, '')
      return cleaned
    })
    .filter(Boolean)

  const applyCapitalization = (segments: string[]): string[] => {
    switch (capitalization) {
      case 'upper':
        return segments.map((s) => s.toUpperCase())
      case 'pascal':
        return segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      case 'camel':
        return segments.map((s, i) =>
          i === 0 ? s.toLowerCase() : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(),
        )
      case 'keep':
        return segments
      case 'lower':
      default:
        return segments.map((s) => s.toLowerCase())
    }
  }

  const transformed = applyCapitalization(cleanedParts)

  // Always join with the provided separator (can be empty string)
  const resultBase = transformed.join(separator)
  let result = resultBase

  // final safety pass: remove leading/trailing non-alnum if any appeared
  result = result.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')

  // ensure validation; if invalid, attempt fallback snake_case
  const { valid } = checkName(result)
  if (!valid) {
    result = snakeCase(result)
  }

  return result
}

export default checkName

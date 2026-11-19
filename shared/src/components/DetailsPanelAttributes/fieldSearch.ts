// The Details tabs' search (details panel, a list's details panel): a field shows when every word
// typed is in its label as shown, its name or its value as shown, ignoring case. A value is found by
// what the panel shows for it too: an enum value by its label, a date as the panel formats it.
import type { AttributeData } from '@shared/api'
import { formatDate, humanizeField } from '@shared/util'

export interface SearchableField {
  name: string
  data: Pick<AttributeData, 'title' | 'type' | 'enum'>
}

const valueTexts = (field: SearchableField, value: unknown): string[] =>
  (Array.isArray(value) ? value : [value]).flatMap((item) => {
    // objects (structured data) have no text a user reads
    if (item === null || item === undefined || item === '' || typeof item === 'object') return []
    const text = String(item)
    const label = field.data.enum?.find((option) => String(option.value) === text)?.label
    const date = field.data.type === 'datetime' ? formatDate(text) : ''
    return [text, label, date].filter((t): t is string => !!t)
  })

/** the words of a search, lower case; none for an empty search */
export const searchWords = (search?: string) =>
  (search || '').toLowerCase().split(/\s+/).filter(Boolean)

/**
 * Whether the field matches the search: every word is in its label, name or value. `shown` adds what
 * the panel shows for the value when it differs (a user's full name). Everything matches no search.
 */
export const matchesFieldSearch = (
  field: SearchableField,
  value: unknown,
  search?: string,
  shown: (string | null | undefined)[] = [],
) => {
  const words = searchWords(search)
  if (!words.length) return true
  const text = [
    humanizeField(field.data.title || field.name),
    field.data.title,
    field.name,
    ...valueTexts(field, value),
    ...shown,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return words.every((word) => text.includes(word))
}

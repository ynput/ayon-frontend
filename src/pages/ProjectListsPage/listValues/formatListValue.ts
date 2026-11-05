import { formatDate } from '@shared/util/formatDate'

type AttributeLike = {
  data: { type?: string | null; enum?: { value: unknown; label: string }[] | null }
}

// Short text for a value in a tooltip, using enum labels where the attribute has them
export const formatListValue = (attribute: AttributeLike | undefined, value: unknown): string => {
  if (value === null || value === undefined || value === '') return 'not set'
  if (Array.isArray(value) && !value.length) return 'not set'

  const enumItems = attribute?.data.enum || []
  const label = (item: unknown) =>
    enumItems.find((option) => option.value === item)?.label ?? String(item)

  if (Array.isArray(value)) return value.map(label).join(', ')
  if (attribute?.data.type === 'datetime' && typeof value === 'string') {
    const date = formatDate(value)
    if (date) return date
  }
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  return label(value)
}

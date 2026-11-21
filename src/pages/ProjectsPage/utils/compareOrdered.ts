// Greater / less than and before / after for the Projects page, which filters its rows in the
// browser (see filterProjects)

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/

/** Numeric comparison, then dates (ISO strings with any offset), then text. */
const compareValues = (a: unknown, b: unknown): number => {
  const numA = Number(a)
  const numB = Number(b)
  if (!isNaN(numA) && !isNaN(numB)) return numA - numB
  if (typeof a === 'string' && typeof b === 'string' && ISO_DATE.test(a) && ISO_DATE.test(b)) {
    const dateA = Date.parse(a)
    const dateB = Date.parse(b)
    if (!isNaN(dateA) && !isNaN(dateB)) return dateA - dateB
  }
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0
}

const isMissing = (value: unknown) => value === null || value === undefined || value === ''

// Without a value on either side an ordered comparison matches nothing, as on the server
export const compareOrdered = (a: unknown, b: unknown, test: (order: number) => boolean): boolean =>
  !isMissing(a) && !isMissing(b) && test(compareValues(a, b))

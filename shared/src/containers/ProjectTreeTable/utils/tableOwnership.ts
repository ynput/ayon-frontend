// Key handlers listen on the document; two tables can be mounted at once (a table in a dialog
// over a page's table), so each one ignores the keys pressed in the other.
export const TABLE_ID_ATTR = 'data-project-table-id'

export const isFromOtherTable = (event: Event, tableId: string) => {
  const target = event.target
  const owner = target instanceof Element ? target.closest(`[${TABLE_ID_ATTR}]`) : null
  return !!owner && owner.getAttribute(TABLE_ID_ATTR) !== tableId
}

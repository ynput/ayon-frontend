export const ROW_SELECTION_COLUMN_ID = '__row_selection__'
export const DRAG_HANDLE_COLUMN_ID = 'drag-handle'

// queried against the cell container's content box, not the row height
export const WRAP_MIN_CELL_HEIGHT = 50
// must mirror the vertical padding of Cell in CellWidget.tsx
const CELL_PADDING_Y = 4
export const WRAP_MIN_ROW_HEIGHT = WRAP_MIN_CELL_HEIGHT + CELL_PADDING_Y * 2

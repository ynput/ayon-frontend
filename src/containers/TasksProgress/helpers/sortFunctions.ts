import { ColumnSortEvent } from 'primereact/column'

// @flynput I think this will be quite easy actually:
// 1. convert the data into a hierarchical structure
// 2. sort top level and children separately
// 3. convert back to flat structure
// 4. profit.

// This is how the sorting is done with treetable
// https://github.com/primefaces/primereact/blob/e47f620bfa69cd1b74e3f9bfdcdc9b9db38f4083/components/lib/treetable/TreeTable.js#L404-L438

// (maybe the hierarchy could be calculated once somewhere so it doesn't have to be recalculated every time the sort changes)
export const folderSort = (e: ColumnSortEvent) => {
  return e.data
}

export const completeSort = (e: ColumnSortEvent) => {
  return e.data
}

export const resolveShiftSelect = (id: string, tableEl: HTMLElement): string[] => {
  try {
    const tbody = tableEl.querySelector('tbody')
    // find the cell for active task

    // START CELL
    let startCell = tbody?.querySelector('.cell-wrapper.active')
    // no active cell, use the first selected task
    if (!startCell) {
      startCell = tbody?.querySelector('.cell-wrapper.selected')
    }
    if (!startCell || !tbody) throw new Error('No active or selected cell found')
    const startTd = startCell.closest('td')
    if (!startTd) throw new Error('No active or selected cell found')
    // start row
    const startRow = startCell.closest('tr')
    if (!startRow) throw new Error('No active or selected row found')
    const startRowIndex = Array.from(tbody.children).indexOf(startRow)
    // start column
    const startCellsContainer = startTd.querySelector('.cells')
    if (!startCellsContainer) throw new Error('No active or selected cell container found')
    const startColIndex = Array.from(startRow.children).indexOf(startTd)
    const startColInnerIndex = Array.from(startCellsContainer.children).indexOf(startCell)

    // END CELL
    const endCell = tbody.querySelector(`[data-task-id="${id}"]`)
    if (!endCell) throw new Error('No end cell found')
    const endTd = endCell.closest('td')
    if (!endTd) throw new Error('No end cell found')
    // end row
    const endRow = endCell.closest('tr')
    if (!endRow) throw new Error('No end row found')
    const endRowIndex = Array.from(tbody.children).indexOf(endRow)
    // end column
    const endCellsContainer = endTd.querySelector('.cells')
    if (!endCellsContainer) throw new Error('No end cell container found')
    const endColIndex = Array.from(endRow.children).indexOf(endTd)
    const endColInnerIndex = Array.from(endCellsContainer.children).indexOf(endCell)

    // get all TD elements between start and end
    const rows = Array.from(tbody.children).slice(
      Math.min(startRowIndex, endRowIndex),
      Math.max(startRowIndex, endRowIndex) + 1,
    ) as HTMLElement[]

    const sameColumn = startColIndex === endColIndex
    const inverseSelection = sameColumn
      ? startColInnerIndex > endColInnerIndex
      : startColIndex > endColIndex

    const taskIds: string[] = []
    rows.forEach((row) => {
      const TDs = Array.from(row.children).slice(
        Math.min(startColIndex, endColIndex),
        Math.max(startColIndex, endColIndex) + 1,
      )

      TDs.forEach((td) => {
        const TdIndex = Array.from(row.children).indexOf(td)
        const cells = td.querySelectorAll('.cell-wrapper')
        cells.forEach((cell, index) => {
          const isInRange =
            index === startColInnerIndex ||
            (index >= startColInnerIndex && index <= endColInnerIndex) ||
            TdIndex < endColIndex
          const isInRangeInverse =
            (index <= startColInnerIndex && index >= endColInnerIndex) || TdIndex > endColIndex

          const isInRangeResolved = inverseSelection ? isInRangeInverse : isInRange
          // console.log({ index, startColInnerIndex, endColInnerIndex, isInRange, isInRangeInverse })

          if (isInRangeResolved) {
            // if the cell is not in the range, skip
            const taskId = cell.getAttribute('data-task-id')
            if (taskId) {
              taskIds.push(taskId)
            }
          }
        })
      })
    })

    return taskIds
  } catch (error) {
    console.error(error)
    return []
  }
}

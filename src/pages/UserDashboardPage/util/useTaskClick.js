import { useSelector } from 'react-redux'
import { onTaskSelected } from '@state/dashboard'

export const useTaskClick = (dispatch) => {
  const selectedTasks = useSelector((state) => state.dashboard.tasks.selected)
  const setSelectedTasks = (tasks) => dispatch(onTaskSelected(tasks))
  // HANDLE TASK CLICK
  const handleTaskClick = (e, id, taskIds) => {
    e?.preventDefault()
    e?.stopPropagation()

    const { metaKey, ctrlKey, shiftKey } = e || {}
    const ctrlOrMeta = metaKey || ctrlKey
    const shift = shiftKey && !ctrlOrMeta

    let newSelection = [...selectedTasks]

    // metaKey or ctrlKey or shiftKey is pressed, add to selection instead of replacing
    const isMulti = ctrlOrMeta || shift

    // add (selected) to selection
    if (!newSelection.includes(id) && isMulti) {
      if (shift && taskIds?.length) {
        // try and find the index of the last selected task
        const lastSelectedIndex = taskIds.findIndex((taskId) => taskId === newSelection[0])
        if (lastSelectedIndex > -1) {
          // add all tasks between the last selected task and the current task (including last selected and current)
          const startIndex = Math.min(lastSelectedIndex, taskIds.indexOf(id))
          const endIndex = Math.max(lastSelectedIndex, taskIds.indexOf(id))
          newSelection = [...new Set([...newSelection, ...taskIds.slice(startIndex, endIndex + 1)])]
        }
      } else {
        // add to selection
        newSelection.push(id)
      }
    } else if (isMulti) {
      // remove from selection
      newSelection = newSelection.filter((taskId) => taskId !== id)
    } else if (!newSelection.includes(id) || newSelection.length > 1) {
      // replace selection
      newSelection = [id]
    } else {
      newSelection = []
    }

    setSelectedTasks(newSelection)
  }

  return handleTaskClick
}

export default useTaskClick

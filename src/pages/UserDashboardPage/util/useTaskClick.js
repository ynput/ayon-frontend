import { useSelector } from 'react-redux'
import { onTaskSelected } from '/src/features/dashboard'

export const useTaskClick = (dispatch) => {
  const selectedTasks = useSelector((state) => state.dashboard.tasks.selected)
  const setSelectedTasks = (tasks) => dispatch(onTaskSelected(tasks))
  // HANDLE TASK CLICK
  const handleTaskClick = (e, id) => {
    e.preventDefault()
    e.stopPropagation()

    const { metaKey, ctrlKey, shiftKey } = e
    const ctrlOrMeta = metaKey || ctrlKey
    const shift = shiftKey && !ctrlOrMeta

    let newSelection = [...selectedTasks]

    // metaKey or ctrlKey or shiftKey is pressed, add to selection instead of replacing
    const isMulti = ctrlOrMeta || shift

    // add (selected) to selection
    if (!newSelection.includes(id) && isMulti) {
      // add to selection
      newSelection.push(id)
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

    // updates the breadcrumbs
    // let uri = `ayon+entity://${projectName}/`
    // uri += `${event.node.data.parents.join('/')}/${event.node.data.folder}`
    // uri += `?product=${event.node.data.name}`
    // uri += `&version=${event.node.data.versionName}`
    // dispatch(setUri(uri))
  }

  return handleTaskClick
}

export default useTaskClick

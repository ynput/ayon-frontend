import { $Any } from '@types'
import { useOpenTaskInViewer } from './useOpenTaskInViewer'
import { useSelector } from 'react-redux'

type Props = {
  tasks: $Any[]
}

// when the user presses spacebar, we want to open the viewer
// check no tasks are already selected (handled by onKeyDown in KanBanColumn)
// check if hovering over a task
// get task and open viewer if you can
export const useTaskSpacebarViewer = ({ tasks = [] }: Props) => {
  const openTaskInViewer = useOpenTaskInViewer()
  const selected = useSelector((state: $Any) => state.dashboard.tasks.selected)

  const handleSpacebar = (e: React.KeyboardEvent<any>) => {
    if (e.key !== ' ') return

    const activeElement = document.activeElement as HTMLElement

    // check active is not on an input or editable element
    const tagName = activeElement?.tagName.toLowerCase()
    const isContentEditable = activeElement?.isContentEditable

    if (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      isContentEditable
    ) {
      return
    }

    if (selected.length) {
      // check if any tasks are selected, we always open that task
      const id = selected[0]

      // find task from id
      const task = tasks.find((t) => t.id === id)

      if (!task) return

      e.preventDefault()
      e.stopPropagation()
      openTaskInViewer(task)
    }
  }

  return handleSpacebar
}

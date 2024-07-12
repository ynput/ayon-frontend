import Shortcuts from '@containers/Shortcuts'
import { $Any } from '@types'
import { MouseEvent, useMemo } from 'react'
import useOpenTaskInViewer from './useOpenTaskInViewer'
import { useSelector } from 'react-redux'

type Props = {
  tasks: $Any[]
  className: string
}

// when the user presses spacebar, we want to open the viewer
// check no tasks are already selected (handled by onKeyDown in KanBanColumn)
// check if hovering over a task
// get task and open viewer if you can
export const useTaskSpacebarViewer = ({ tasks = [], className }: Props) => {
  const openTaskInViewer = useOpenTaskInViewer()
  const selected = useSelector((state: $Any) => state.dashboard.tasks.selected)

  const handleSpacebar = (e: MouseEvent<HTMLDivElement>) => {
    let id: string | null = null
    if (selected.length) {
      // check if any tasks are selected, we always open that task
      id = selected[0]
    } else {
      // nothing selected, check if hovering over a task
      const target = e.target as HTMLElement
      const closestId = target?.closest(className)?.id
      if (closestId) id = closestId
    }

    if (id) {
      // find task from id
      const task = tasks.find((t) => t.id === id)

      if (!task) return

      openTaskInViewer(task)
    }
  }

  const shortcuts = useMemo(() => {
    return [
      {
        key: ' ',
        action: handleSpacebar,
      },
    ]
  }, [tasks, selected])

  return <Shortcuts shortcuts={shortcuts} deps={[tasks, selected]} />
}

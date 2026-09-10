import { useViewsContext } from '../context/ViewsContext'

// Identity of the layout the user is editing. Stays put when a named view forks into the working
// view, so a debounced write started before the fork still lands.
export const useViewLayoutId = (): string | undefined => {
  const { selectedView, editingViewId } = useViewsContext()
  return editingViewId ?? selectedView?.id
}

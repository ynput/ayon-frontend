// This is a helper component that expands the parent folders of the focused folders
// we do it like this because uri causes a re-render even when the focused folders do not change
// selecting a product or version will cause this to re-render
// re-rendering the hierarchy is extremely expensive

import { FC, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setExpandedFolders } from '@state/context'
import { useURIContext } from '@context/UriContext'

interface HierarchyExpandFoldersProps {
  parents?: Record<string, string[] | undefined>
  isSuccess: boolean
  focusedFolders?: string[]
  expandedFolders: Record<string, boolean>
}

const HierarchyExpandFolders: FC<HierarchyExpandFoldersProps> = ({
  parents = {},
  isSuccess,
  focusedFolders = [],
  expandedFolders,
}) => {
  const dispatch = useDispatch()
  const { uri } = useURIContext()

  // when selection changes programmatically, expand the parent folders
  // runs every time the uri changes
  useEffect(() => {
    if (!focusedFolders?.length || !isSuccess) return

    let toExpand: string[] = [...Object.keys(expandedFolders)]
    for (const id of focusedFolders) {
      const parentIds = parents[id]
      if (parentIds) {
        toExpand = toExpand.concat(parentIds)
      }
    }
    // de-duplicate toExpand and remove null/undefined
    toExpand = [...new Set(toExpand)]
    toExpand = toExpand.filter((x) => x)

    // abort if there's no change
    if (toExpand.length === Object.keys(expandedFolders).length) return

    // create a map of the expanded folders
    const newExpandedFolders: Record<string, boolean> = {}
    for (const id of toExpand) {
      newExpandedFolders[id] = true
    }
    dispatch(setExpandedFolders(newExpandedFolders))
  }, [uri, isSuccess, focusedFolders, expandedFolders, parents, dispatch])

  return null
}

export default HierarchyExpandFolders

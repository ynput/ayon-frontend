// This is a helper component that expands the parent folders of the focused folders
// we do it like this because uri causes a re-render even when the focused folders do not change
// selecting a product or version will cause this to re-render
// re-rendering the hierarchy is extremely expensive

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setExpandedFolders } from '@state/context'

const HierarchyExpandFolders = ({ parents = [], isSuccess, focusedFolders, expandedFolders }) => {
  const uri = useSelector((state) => state.context.uri)

  const dispatch = useDispatch()

  // when selection changes programmatically, expand the parent folders
  // runs every time the uri changes
  useEffect(() => {
    if (!focusedFolders?.length || !isSuccess) return

    let toExpand = [...Object.keys(expandedFolders)]
    for (const id of focusedFolders) {
      toExpand = toExpand.concat(parents[id])
    }
    // de-duplicate toExpand and remove null/undefined
    toExpand = [...new Set(toExpand)]
    toExpand = toExpand.filter((x) => x)

    // abort if there's no change
    if (toExpand.length === Object.keys(expandedFolders).length) return

    //create a map of the expanded folders
    const newExpandedFolders = {}
    for (const id of toExpand) {
      newExpandedFolders[id] = true
    }
    dispatch(setExpandedFolders(newExpandedFolders))
  }, [uri, isSuccess])

  return null
}

export default HierarchyExpandFolders

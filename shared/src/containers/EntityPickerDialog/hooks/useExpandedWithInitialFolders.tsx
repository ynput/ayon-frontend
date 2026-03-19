// if there is a initial folderId, expand all folders to that folder

import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { Dispatch, SetStateAction, useEffect, useState, useMemo } from 'react'
import { EntityQueryResult } from './useGetEntityPickerData'
import { getExpandedFoldersFromIds } from '../util'
import { FolderListItem } from '@shared/api'

interface useInitialExpandedFoldersProps {
  foldersSelection?: RowSelectionState
  foldersData?: EntityQueryResult
}

const useExpandedWithInitialFolders = ({
  foldersSelection,
  foldersData,
}: useInitialExpandedFoldersProps): [ExpandedState, Dispatch<SetStateAction<ExpandedState>>] => {
  // the expanded state of the folders tree table
  const [expanded, setExpanded] = useState<ExpandedState>({})

  // Memoize selected folder IDs to prevent unnecessary recalculations
  const selectedFolderIds = useMemo(() => {
    if (!foldersSelection) return []
    return Object.keys(foldersSelection).filter((id) => foldersSelection[id] === true)
  }, [foldersSelection])

  // Memoize folders data to prevent unnecessary recalculations
  const folders = useMemo(() => {
    return foldersData?.data as FolderListItem[] | undefined
  }, [foldersData?.data])

  // State to track if folders have already been expanded
  const [foldersExpanded, setFoldersExpanded] = useState(false)
  useEffect(() => {
    // check if we need to expand folders based on the initial selection
    if (selectedFolderIds.length === 0 || !folders?.length) {
      return
    }

    // if we have already expanded folders, do not re-expand
    if (foldersExpanded) {
      return
    }

    // find the expanded folders required for the initial selection
    const expandedFolders = getExpandedFoldersFromIds(selectedFolderIds, folders)

    setExpanded(expandedFolders)
    setFoldersExpanded(true)
  }, [selectedFolderIds, folders, setFoldersExpanded, foldersExpanded])

  return [expanded, setExpanded]
}

export default useExpandedWithInitialFolders

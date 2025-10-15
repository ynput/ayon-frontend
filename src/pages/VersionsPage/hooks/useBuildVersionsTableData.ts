import { TableRow } from '@shared/containers'
import { buildVersionRow, VersionsMap } from '../util'
import { useMemo } from 'react'

type Props = {
  rootVersionsMap: VersionsMap
  childVersionsMap: VersionsMap
  isStacked: boolean
}

export const useBuildVersionsTableData = ({
  rootVersionsMap,
  childVersionsMap,
  isStacked,
}: Props): TableRow[] => {
  return useMemo(() => {
    if (isStacked) {
      // build hierarchical data
      return []
    } else {
      // build flat data using only versionsMap
      return Array.from(rootVersionsMap.values()).map((version) => buildVersionRow(version))
    }
  }, [rootVersionsMap, childVersionsMap, isStacked])
}

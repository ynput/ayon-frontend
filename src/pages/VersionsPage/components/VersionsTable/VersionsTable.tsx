import { ProjectTreeTable } from '@shared/containers'
import { FC } from 'react'
import { useVersionsDataContext } from '../../context/VersionsDataContext'

interface VersionsTableProps {
  readOnly?: string[]
}

const VersionsTable: FC<VersionsTableProps> = ({ readOnly = [] }) => {
  const { fetchNextPage, isStacked } = useVersionsDataContext()

  return (
    <ProjectTreeTable
      scope={'version'}
      sliceId={''}
      // pagination
      onScrollBottom={fetchNextPage}
      readOnly={readOnly}
      excludedColumns={['assignees']}
      isExpandable={isStacked}
    />
  )
}

export default VersionsTable

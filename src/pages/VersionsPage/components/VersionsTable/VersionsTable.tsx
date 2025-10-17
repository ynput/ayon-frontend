import { ProjectTreeTable } from '@shared/containers'
import { FC } from 'react'
import { useVersionsDataContext } from '../../context/VersionsDataContext'

interface VersionsTableProps {
  readOnly?: string[]
}

const VersionsTable: FC<VersionsTableProps> = ({ readOnly = [] }) => {
  const { fetchNextPage, showProducts } = useVersionsDataContext()

  return (
    <ProjectTreeTable
      scope={'version'}
      sliceId={''}
      // pagination
      onScrollBottom={fetchNextPage}
      readOnly={readOnly}
      excludedColumns={['assignees']}
      isExpandable={showProducts}
    />
  )
}

export default VersionsTable

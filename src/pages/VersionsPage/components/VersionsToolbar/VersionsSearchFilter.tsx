import { FC } from 'react'
import SearchFilterWrapper from '@pages/ProjectOverviewPage/containers/SearchFilterWrapper'
import { useVersionsDataContext } from '@pages/VersionsPage/context/VersionsDataContext'
import { useProjectDataContext } from '@shared/containers'

interface VersionsSearchFilterProps {}

const VersionsSearchFilter: FC<VersionsSearchFilterProps> = ({}) => {
  const { projectInfo, projectName } = useProjectDataContext()
  const { filter, setFilter } = useVersionsDataContext()

  return (
    <SearchFilterWrapper
      queryFilters={filter}
      onChange={setFilter}
      scope={'version'}
      projectNames={[projectName]}
      projectInfo={projectInfo}
      filterTypes={['status', 'tags', 'attributes']}
      enableGlobalSearch={false}
    />
  )
}

export default VersionsSearchFilter

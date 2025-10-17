import { FC } from 'react'
import SearchFilterWrapper from '@pages/ProjectOverviewPage/containers/SearchFilterWrapper'
import { useVersionsDataContext } from '@pages/VersionsPage/context/VersionsDataContext'
import { useProjectDataContext } from '@shared/containers'

interface VersionsSearchFilterProps {}

const VersionsSearchFilter: FC<VersionsSearchFilterProps> = ({}) => {
  const { projectInfo, projectName } = useProjectDataContext()
  const { versionFilter, setVersionFilter } = useVersionsDataContext()

  return (
    <SearchFilterWrapper
      queryFilters={versionFilter}
      onChange={setVersionFilter}
      scope={'version'}
      projectNames={[projectName]}
      projectInfo={projectInfo}
      filterTypes={['status', 'author', 'tags', 'productType', 'attributes']}
      enableGlobalSearch={false}
    />
  )
}

export default VersionsSearchFilter

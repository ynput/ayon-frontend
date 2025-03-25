import EntityThumbnailUploader from '@components/EntityThumbnailUploader/EntityThumbnailUploader'
import useFocusedEntities from '@hooks/useFocused'
import { useGetEntitiesDetailsPanelQuery } from '@queries/entity/getEntityPanel'
import { useGetProjectsInfoQuery } from '@queries/userDashboard/getUserDashboard'
import { getEntityDetailsData } from '@queries/userDashboard/userDashboardHelpers'
import { entityDetailsTypesSupported } from '@queries/userDashboard/userDashboardQueries'
import { $Any } from '@types'

type Props = {
  children: JSX.Element[]
  projectName: string
  onUpload: Function
}

const EntityThumbnailUploaderRow = ({
  children,
  projectName,
  onUpload,
}: Props) => {


  // Focused type doesn't apply in editor page, we need to specifically pass the editor focusType
  const { entities, entityType } = useFocusedEntities(projectName, 'editor')
  const { data: projectsInfo = {} } = useGetProjectsInfoQuery({ projects: [projectName] })

  let entitiesToQuery = entities.length
    ? entities.map((entity: $Any) => ({ id: entity.id, projectName: entity.projectName }))
    : []

  const {
    data: detailsData = [],
    isFetching: isFetchingEntitiesDetails,
    isSuccess,
    isError,
    refetch,
  } = useGetEntitiesDetailsPanelQuery(
    { entityType, entities: entitiesToQuery, projectsInfo },
    { skip: !entitiesToQuery.length || !entityDetailsTypesSupported.includes(entityType) },
  )
  // merge current entities data with fresh details data
  const entityDetailsData = getEntityDetailsData({
    entities,
    entityType,
    projectsInfo,
    detailsData,
    isSuccess,
    isError,
  })

  const handleUploaded = (operations: $Any) => {
    for (const operation of operations) {
      const { id, updatedAt } = {
        id: operation.id,
        updatedAt: operation?.data?.updatedAt,
      }
      onUpload(id, updatedAt)
    }

    refetch()
  }

  return (
    <EntityThumbnailUploader
      isCompact
      entities={isFetchingEntitiesDetails ? entitiesToQuery : entityDetailsData}
      projectName={projectName}
      entityType={entityType}
      onUploaded={handleUploaded}
    >
      {children}
    </EntityThumbnailUploader>
  )
}
export default EntityThumbnailUploaderRow

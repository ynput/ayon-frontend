import { useSelector } from 'react-redux'
import { Panel } from '@ynput/ayon-react-components'
import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'
import { TagsField } from '/src/containers/fieldFormat'
import { getFamilyIcon } from '/src/utils'
import RepresentationList from './representationList'
import { useUpdateEntitiesDetailsMutation } from '/src/services/updateEntitiesDetails'
import { useGetEntitiesDetailsQuery } from '/src/services/getEntitiesDetails'

import StatusSelect from '../../components/status/statusSelect'
import usePubSub from '/src/hooks/usePubSub'

const transformVersionsData = (versions) => {
  let vArr = []
  let rArr = []

  for (const versionEdge of versions) {
    const version = versionEdge.node
    const subset = version.subset
    const folder = subset.folder
    vArr.push({
      id: version.id,
      version: version.version,
      name: version.name,
      author: version.author,
      attrib: version.attrib,
      status: version.status,
      tags: version.tags,
      family: subset.family,
      subsetName: subset.name,
      folderName: folder.name,
    })
    for (const representationEdge of version.representations.edges) {
      const representation = representationEdge.node
      rArr.push({
        id: representation.id,
        name: representation.name,
        folderName: folder.name,
        subsetName: subset.name,
        family: subset.family,
        fileCount: representation.fileCount,
        // for breadcrumbs
        versionName: version.name,
        folderParents: folder.parents,
      })
    }
  }

  return [vArr, rArr]
}

const VersionDetail = () => {
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const focusedVersions = context.focused.versions

  // GET RTK QUERY
  const {
    data: versionsData,
    isLoading,
    isError,
    refetch,
  } = useGetEntitiesDetailsQuery(
    {
      projectName,
      ids: focusedVersions,
      type: 'version',
    },
    { skip: !focusedVersions },
  )

  // PUBSUB HOOK
  usePubSub('entity.version', refetch, focusedVersions)

  // PATCH VERSIONS DATA
  const [updateFolder] = useUpdateEntitiesDetailsMutation()

  if (isLoading) return 'loading..'

  if (isError) return 'ERROR: Soemthing went wrong...'
  // transform data
  const [versions, representations] = transformVersionsData(versionsData)

  // No version selected. do not show the detail
  if (!versions || !versions.length) return null

  const handleStatusChange = async (value, entity) => {
    try {
      const payload = await updateFolder({
        projectName,
        type: 'version',
        data: { status: value },
        ids: [entity.id],
      }).unwrap()

      console.log('fulfilled', payload)
    } catch (error) {
      console.error('rejected', error)
    }
  }

  let versionDetailWidget

  // Multiple versions selected. Show an info message
  if (versions.length > 1) {
    versionDetailWidget = (
      <Panel>
        <span>{versions.length} versions selected</span>
      </Panel>
    )
  }

  // One version selected. Show the detail
  else {
    versionDetailWidget = (
      <Panel>
        <h3>
          <span className="material-symbols-outlined" style={{ verticalAlign: 'bottom' }}>
            {getFamilyIcon(versions[0].family)}
          </span>
          <span style={{ marginLeft: 10 }}>
            {versions[0].subsetName} | {versions[0].name}
          </span>
        </h3>
        <Thumbnail projectName={projectName} entityType="version" entityId={versions[0].id} />
        <AttributeTable
          entityType="version"
          data={versions[0].attrib}
          additionalData={[
            { title: 'Author', value: versions[0].author },
            {
              title: 'Status',
              value: (
                <StatusSelect
                  value={versions[0].status}
                  statuses={context.project.statuses}
                  align={'right'}
                  onChange={(v) => handleStatusChange(v, versions[0])}
                />
              ),
            },
            { title: 'Tags', value: <TagsField value={versions[0].tags} /> },
          ]}
        />
      </Panel>
    )
  }

  // Return Version and representation detail
  return (
    <>
      {versionDetailWidget}
      {representations && <RepresentationList representations={representations} />}
    </>
  )
}

export default VersionDetail

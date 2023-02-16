import { useSelector } from 'react-redux'
import { Panel } from '@ynput/ayon-react-components'
import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'
import { TagsField } from '/src/containers/fieldFormat'
import RepresentationList from '../RepresentationList'
import { useUpdateEntitiesDetailsMutation } from '../../../services/entity/updateEntity'
import { useGetEntitiesDetailsQuery } from '../../../services/entity/getEntity'

import StatusSelect from '/src/components/status/statusSelect'
import usePubSub from '/src/hooks/usePubSub'
import styled from 'styled-components'

const LoadingPanelStyled = styled.div`
  /* isLoading grey out */
  opacity: ${(props) => (props.isLoading ? 0.5 : 1)};
`

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
  const projectName = useSelector((state) => state.project.name)
  const focusedVersions = useSelector((state) => state.context.focused.versions)
  const families = useSelector((state) => state.project.families)

  // GET RTK QUERY
  const {
    data: versionsData = [],
    isLoading,
    isFetching,
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

  if (isError) return 'ERROR: Something went wrong...'
  // transform data
  const [versions, representations] = transformVersionsData(versionsData)

  // No version selected. do not show the detail
  if (!versions || !versions.length) return null

  const handleStatusChange = async (value, entity) => {
    const patches = [...versionsData].map(({ node }) =>
      node.id === entity.id ? { ...node, status: value } : node,
    )

    try {
      const payload = await updateFolder({
        projectName,
        type: 'version',
        data: { status: value },
        ids: [entity.id],
        patches,
      }).unwrap()

      console.log('fulfilled', payload)
    } catch (error) {
      console.error('rejected', error)
    }
  }

  // Return Version and representation detail
  return (
    <LoadingPanelStyled isLoading={isLoading || isFetching}>
      {versions.length > 1 ? (
        <Panel>
          <span>{versions.length} versions selected</span>
        </Panel>
      ) : (
        <Panel>
          <h3>
            <span className="material-symbols-outlined" style={{ verticalAlign: 'bottom' }}>
              {(versions[0].family && families[versions[0].family]?.icon) || 'help_center'}
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
                    align={'right'}
                    onChange={(v) => handleStatusChange(v, versions[0])}
                  />
                ),
              },
              { title: 'Tags', value: <TagsField value={versions[0].tags} /> },
            ]}
          />
        </Panel>
      )}
      {representations && <RepresentationList representations={representations} />}
    </LoadingPanelStyled>
  )
}

export default VersionDetail

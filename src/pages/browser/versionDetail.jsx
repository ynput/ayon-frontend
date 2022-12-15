import axios from 'axios'
import ayonClient from '/src/ayon'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Panel } from 'openpype-components'

import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'
import { StatusField, TagsField } from '/src/containers/fieldFormat'
import { getFamilyIcon } from '/src/utils'

import RepresentationList from './representationList'
import { setReload } from '../../features/context'

const VERSION_QUERY = `
    query Versions($projectName: String!, $versions: [String!]!) {
        project(name: $projectName) {
            versions(ids: $versions) {
                edges {
                    node {
                        id
                        version
                        name
                        author
                        status
                        tags
                        attrib {
                          #VERSION_ATTRS#
                        }
                        subset {
                            name
                            family
                            folder {
                                name
                                parents
                            }
                        }
                        representations{
                            edges {
                                node {
                                    id
                                    name
                                    fileCount
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`

const buildVersionQuery = () => {
  let f_attribs = ''
  for (const attrib of ayonClient.settings.attributes) {
    if (attrib.scope.includes('version')) f_attribs += `${attrib.name}\n`
  }
  return VERSION_QUERY.replace('#VERSION_ATTRS#', f_attribs)
}

const VersionDetail = () => {
  const dispatch = useDispatch()
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const [versions, setVersions] = useState([])
  const [representations, setRepresentations] = useState([])

  const query = buildVersionQuery()

  const getVersionData = () => {
    if (!(context.focusedVersions && context.focusedVersions.length)) {
      setVersions([])
      setRepresentations([])
      return
    }

    axios
      .post('/graphql', {
        query: query,
        variables: { projectName, versions: context.focusedVersions },
      })
      .then((response) => {
        const data = response.data.data
        if (!(data && data.project)) {
          console.log('ERROR', data.errors[0].message)
          return
        }

        const projectData = data.project
        let vArr = []
        let rArr = []

        for (const versionEdge of projectData.versions.edges) {
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
        setVersions(vArr)
        setRepresentations(rArr)
      })
  }

  // Load versions and representations
  useEffect(() => {
    getVersionData()
    //eslint-disable-next-line
  }, [context.projectName, context.focusedVersions, projectName])

  const reload = context.reload.version

  // reload
  useEffect(() => {
    if (reload) {
      console.log('reloading version detail')
      getVersionData()
      // reset reload
      dispatch(setReload({ type: 'version', reload: false }))
    }
  }, [reload])

  //
  // Render
  //

  // No version selected. do not show the detail
  if (!versions || !versions.length) return <></>

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
          <span
            className="material-symbols-outlined"
            style={{ verticalAlign: 'bottom' }}
          >
            {getFamilyIcon(versions[0].family)}
          </span>
          <span style={{ marginLeft: 10 }}>
            {versions[0].subsetName} | {versions[0].name}
          </span>
        </h3>
        <Thumbnail
          projectName={projectName}
          entityType="version"
          entityId={versions[0].id}
        />
        <AttributeTable
          entityType="version"
          data={versions[0].attrib}
          additionalData={[
            { title: 'Author', value: versions[0].author },
            {
              title: 'Status',
              value: <StatusField value={versions[0].status} />,
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
      {representations && (
        <RepresentationList representations={representations} />
      )}
    </>
  )
}

export default VersionDetail

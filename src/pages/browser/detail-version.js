import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Thumbnail from '../../containers/thumbnail'

import axios from 'axios'

import RepresentationDetail from './detail-representation'

const VERSION_QUERY = `
    query Versions($projectName: String!, $versions: [String!]!) {
        project(name: $projectName) {
            versions(ids: $versions) {
                edges {
                    node {
                        version
                        name
                        author
                        attrib {
                          #VERSION_ATTRS#
                        }
                        subset {
                            name
                            family
                            folder {
                                name
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



const buildVersionQuery = (attributes) => {
  let f_attribs = ''
  for (const attrib of attributes) {
    if (attrib.scope.includes('version')) f_attribs += `${attrib.name}\n`
  }
  return VERSION_QUERY.replace('#VERSION_ATTRS#', f_attribs)
}


const VersionDetail = () => {
  const context = useSelector((state) => ({ ...state.context }))
  const settings = useSelector((state) => ({ ...state.settings }))
  const projectName = context.projectName
  const [versions, setVersions] = useState([])
  const [representations, setRepresentations] = useState([])

  useEffect(() => {
    if (!(context.focusedVersions && context.focusedVersions.length)) {
      setVersions(null)
      setRepresentations(null)
      return
    }

    axios
      .post('/graphql', {
        query: buildVersionQuery(settings.attributes),
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
            })
          }
        }

        console.log(vArr)
        setVersions(vArr)
        setRepresentations(rArr)
      })

    //eslint-disable-next-line
  }, [context.projectName, context.focusedVersions, projectName])

  return (
    <>
        {(versions.length > 1 || !versions.length) ? (
          `${versions.length} versions selected`
        ) : (
        <section className="column">
          <h3>
            <span>{versions[0].subsetName} {versions[0].name}</span>
          </h3>
          <Thumbnail
            projectName={projectName}
            entityType="version"
            entityId={versions[0].id}
          />
          <h4 style={{ marginTop: 10 }}>Attributes</h4>
          <table>
            <tbody>
              {versions[0].attrib &&
                settings.attributes
                  .filter(
                    (attr) =>
                      attr.scope.includes('version') && versions[0].attrib[attr.name]
                  )
                  .map((attr) => (
                    <tr key={attr.name}>
                      <td>{attr.title}</td>
                      <td>{versions[0].attrib[attr.name]}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </section>
        )}

      {representations && (
        <RepresentationDetail representations={representations} />
      )}
    </>
  )
}

export default VersionDetail

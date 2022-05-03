import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import axios from 'axios'

import RepresentationDetail from './detail-representation'

const VERSION_QUERY = `
    query Versions($projectName: String!, $versions: [String!]!) {
        project(name: $projectName) {
            versions(ids: $versions) {
                edges {
                    node {
                        version
                        author
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

const VersionInfoWidget = ({data}) => {
  return (<pre>
    <code>{JSON.stringify(data, null, 2)}</code>
  </pre>)

}


const VersionDetail = () => {
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const [versions, setVersions] = useState([])
  const [representations, setRepresentations] = useState([])

  useEffect(() => {
    if (!context.focusedVersions.length) {
      setVersions(null)
      setRepresentations(null)
      return
    }

    axios
      .post('/graphql', {
        query: VERSION_QUERY,
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

        setVersions(vArr)
        setRepresentations(rArr)
      })

    //eslint-disable-next-line
  }, [context.projectName, context.focusedVersions, projectName])

  return (
    <>
      <section className="row">
        {versions.length > 1 ? `${versions.length} versions selected` : <VersionInfoWidget data={versions[0]} />}
      </section>
      {representations && (
        <RepresentationDetail representations={representations} />
      )}
    </>
  )
}

export default VersionDetail

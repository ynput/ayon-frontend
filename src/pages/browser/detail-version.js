import {useState, useEffect} from 'react'
import {useSelector } from 'react-redux'
import {useFetch} from 'use-http'

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


const VersionDetail = () => {
  const context = useSelector((state) => ({ ...state.contextReducer }))
  const projectName = context.projectName
  const request = useFetch('/graphql')

  const [versions, setVersions] = useState([])
  const [representations, setRepresentations] = useState([])

  useEffect(() => {
    async function fetchData() {
      const data = await request.query(VERSION_QUERY, {
        projectName: projectName,
        versions: context.focusedVersions,
      })

      if (!(data.data && data.data.project)) {
        console.log('ERROR', data.errors[0].message)
        return
      }

      const projectData = data.data.project
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
    }

    if (context.focusedVersions.length > 0) fetchData()
    else {
      setVersions(null)
      setRepresentations(null)
    }
    //eslint-disable-next-line
  }, [context.projectName, context.focusedVersions, projectName])

  return (
    <>
      <section className="row">{versions.length} versions selected.</section>

      {representations && <RepresentationDetail representations={representations} />}
    </>
  )
}

export default VersionDetail

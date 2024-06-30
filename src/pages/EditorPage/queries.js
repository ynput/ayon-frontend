import ayonClient from '@/ayon'

const BASE_QUERY = `
  query FolderTree($projectName: String!, $parents: [String!]!) {
    project(name: $projectName) {
      folders(parentIds: $parents, sortBy: "name", last: 1000) {
        edges {
          node {
            id
            name
            label
            tags
            folderType
            hasChildren
            hasTasks
            parents
            parentId
            ownAttrib
            status
            updatedAt
            attrib {
              #FOLDER_ATTRS#
            }
          }
        }
      }
      tasks(folderIds: $parents){
        edges {
          node {
            id
            label
            tags
            name
            taskType
            ownAttrib
            folderId
            status
            assignees
            updatedAt
            attrib {
              #TASK_ATTRS#
            }
          }
        }
      }
    }
  }
`

const buildQuery = (query) => {
  let f_attribs = ''
  let t_attribs = ''
  for (const attrib of ayonClient.settings.attributes) {
    if (attrib.scope.includes('folder')) f_attribs += `${attrib.name}\n`
    if (attrib.scope.includes('task')) t_attribs += `${attrib.name}\n`
  }
  const QUERY = query || BASE_QUERY
  return QUERY.replace('#FOLDER_ATTRS#', f_attribs).replace('#TASK_ATTRS#', t_attribs)
}

export { buildQuery }

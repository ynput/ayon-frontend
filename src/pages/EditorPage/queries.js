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

const BASE_MULTI_FOLDER_QUERY = `
  query FolderTree($projectName: String!, $folders: [String!]!) {
    project(name: $projectName) {
      folders(ids: $folders, sortBy: "name", last: 1000) {
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
      tasks(folderIds: $folders){
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

const buildMultiFolderQuery = (query) => {
  let f_attribs = ''
  let t_attribs = ''
  for (const attrib of ayonClient.settings.attributes) {
    if (attrib.scope.includes('folder')) f_attribs += `${attrib.name}\n`
    if (attrib.scope.includes('task')) t_attribs += `${attrib.name}\n`
  }
  const QUERY = query || BASE_MULTI_FOLDER_QUERY
  return QUERY.replace('#FOLDER_ATTRS#', f_attribs).replace('#TASK_ATTRS#', t_attribs)
}

export { buildQuery, buildMultiFolderQuery }

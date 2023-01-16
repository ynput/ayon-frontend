import ayonClient from '/src/ayon'

const BASE_QUERY = `
  query FolderTree($projectName: String!, $parent: String!) {
    project(name: $projectName) {
      folders(parentId: $parent) {
        edges {
          node {
            id
            name
            folderType
            hasChildren
            hasTasks
            parents
            parentId
            ownAttrib
            attrib {
              #FOLDER_ATTRS#
            }
          }
        }
      }
      tasks(folderIds: [$parent]){
        edges {
          node {
            id
            name
            taskType
            ownAttrib
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

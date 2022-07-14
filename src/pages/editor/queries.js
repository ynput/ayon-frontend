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
            attrib {
              #TASK_ATTRS#
            }
          }
        }
      }
    }
  }
`

const buildQuery = (attributes) => {
  let f_attribs = ''
  let t_attribs = ''
  for (const attrib of attributes) {
    if (attrib.scope.includes('folder')) f_attribs += `${attrib.name}\n`
    if (attrib.scope.includes('task')) t_attribs += `${attrib.name}\n`
  }
  return BASE_QUERY.replace('#FOLDER_ATTRS#', f_attribs).replace(
    '#TASK_ATTRS#',
    t_attribs
  )
}

export { buildQuery }

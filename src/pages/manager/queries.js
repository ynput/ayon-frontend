const FOLDERS_QUERY = `
    query FolderTree($projectName: String!, $parent: String!) {
        project(name: $projectName) {
            folders(parentId: $parent) {
                edges {
                    node {
                        id
                        name
                        hasChildren
                        childrenCount
                        attrib {
                            #ATTRS#
                        }
                    }
                }
            }
        }
    }
`




const buildQuery = (entityType, settings) => {
  let attribs = ""
  for (const attrib of settings.attributes){
    if (attrib.scope.includes(entityType))
      attribs += `${attrib.name}\n`
  }
  return {
    folder: FOLDERS_QUERY,
  }[entityType].replace("#ATTRS#", attribs)
}

export {buildQuery}

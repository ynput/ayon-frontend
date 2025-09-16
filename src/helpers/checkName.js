const checkName = (name) => {
  let newName = name
  // check name matches regex
  const regex = /^[a-zA-Z0-9_]([a-zA-Z0-9_\\.\\-]*[a-zA-Z0-9_])?$/
  // if not, convert to snake_case
  if (name && !name.match(regex)) {
    // remove any trailing or leading special characters
    name = name.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
    // remove any special characters
    newName = name.replace(/[^a-zA-Z0-9]/g, '_')
  }

  return newName
}

export default checkName

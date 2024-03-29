import { snakeCase } from 'lodash'

const checkName = (name) => {
  let newName = name
  // check name matches regex
  const regex = /^[a-zA-Z_][a-zA-Z_]*[a-zA-Z_]$/
  // if not, convert to snake_case
  if (name && !name.match(regex)) {
    newName = snakeCase(name)
  }

  return newName
}

export default checkName

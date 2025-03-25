const appendOrUpdateNumericSuffix = (
  value: string,
  existingValues: string[],
  separator: string,
) => {
  const tokens = value.split(separator)
  const lastToken = tokens[tokens.length - 1]

  let suffix = 2
  let chunk = value
  if (!isNaN(Number(lastToken))) {
    suffix = parseInt(lastToken)
    chunk = [...tokens.slice(0, -1)].join(separator)
  }

  let retVal = chunk + separator + suffix
  while (existingValues.includes(retVal)) {
    retVal = chunk + separator + suffix++
  }

  return retVal
}
const capitalizeFirstLetter = (text: string) => {
  return text[0].toUpperCase() + text.slice(1)

}

export { appendOrUpdateNumericSuffix, capitalizeFirstLetter }
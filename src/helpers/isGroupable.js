const isGroupable = (data, key, value) => {
  // Returns true if the key with the given value is
  // presented multiple times in the array
  // and therefore can be grouped.
  let count = 0
  for (const item of data) {
    if (item[key] === value) {
      count++
      if (count > 1) return true
    }
  }
  return false
}

export default isGroupable

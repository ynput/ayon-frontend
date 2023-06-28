const sortSemver = (arr) => {
  arr.sort(function (a, b) {
    const aParts = a.split('.')
    const bParts = b.split('.')
    const len = Math.max(aParts.length, bParts.length)
    for (let i = 0; i < len; i++) {
      const aPart = aParts[i] || ''
      const bPart = bParts[i] || ''
      if (aPart === bPart) {
        continue
      }
      if (!isNaN(aPart) && !isNaN(bPart)) {
        return parseInt(aPart) - parseInt(bPart)
      }
      return aPart.localeCompare(bPart)
    }
    return 0
  })
  return arr
}

export default sortSemver

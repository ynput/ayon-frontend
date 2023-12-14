export default (addons = [], bundles = []) => {
  const result = new Map()

  // we invert bundles to list addons by version and then by bundle
  bundles.forEach((item) => {
    Object.entries(item.addons).forEach(([addonName, version]) => {
      if (!result.has(addonName)) {
        result.set(addonName, new Map())
      }
      if (!result.get(addonName).has(version)) {
        result.get(addonName).set(version, [])
      }
      result.get(addonName).get(version).push(item.name)
    })
  })

  // merge in remaining addons and versions from addons (these are versions that are not in bundles)
  addons.forEach((item) => {
    Object.entries(item.versions).forEach(([version]) => {
      if (!result.has(item.name)) {
        result.set(item.name, new Map())
      }
      if (!result.get(item.name).has(version)) {
        // create empty array for bundles
        result.get(item.name).set(version, [])
      }
    })
  })

  return result
}

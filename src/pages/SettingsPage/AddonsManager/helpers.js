export const transformAddonsWithBundles = (addons = [], bundles = []) => {
  const result = new Map()

  // we invert bundles to list addons by version and then by bundle
  bundles.forEach((item) => {
    Object.entries(item.addons).forEach(([addonName, version]) => {
      if (!result.has(addonName)) {
        result.set(addonName, new Map())
      }
      if (!result.get(addonName).has(version)) {
        result.get(addonName).set(version, new Map())
      }
      result.get(addonName).get(version).set(item.name, item)
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
        result.get(item.name).set(version, new Map())
      }
    })
  })

  // sort result by key alphabetically
  const sortedResult = new Map([...result.entries()].sort())

  return sortedResult
}

const statuses = ['dev', 'staging', 'production']

export const transformAddonsTable = (addons = []) => {
  let tableData = []
  addons.forEach((versionsMap, addonName) => {
    let status = []
    if (versionsMap.size > 0) {
      const versionsArray = Array.from(versionsMap.values())
      statuses.forEach((s) => {
        if (
          versionsArray.some((bundles) =>
            Array.from(bundles.values()).some(
              (bundle) => bundle[`is${s.charAt(0).toUpperCase() + s.slice(1)}`],
            ),
          )
        ) {
          status.push(s)
        }
      })
      if (status.length === 0 && versionsArray.some((bundles) => bundles.size > 0)) {
        status.push('active')
      }
    }
    tableData.push({ name: addonName, status })
  })
  return tableData
}

// data: map of the addons, versions, bunddles
// get map of unique versions for addons
export const getVersionsForAddons = (data, addons = []) => {
  const result = new Map()

  addons.forEach((addonName) => {
    if (data.has(addonName)) {
      const versionsMap = data.get(addonName)
      versionsMap.forEach((bundlesMap, version) => {
        if (!result.has(version)) {
          result.set(addonName + ' ' + version, bundlesMap)
        }
      })
    }
  })

  return result
}

// versions: maps of the versions
export const transformVersionsTable = (data, addons = [], deletedVersions) => {
  const versionsMap = getVersionsForAddons(data, addons)

  if (!versionsMap) return []

  let tableData = []
  versionsMap.forEach((bundlesMap, version) => {
    const status = []
    if (deletedVersions.includes(version)) {
      status.push('error')
      version = version + ' (deleted)'
    } else if (bundlesMap.size > 0) {
      const bundlesArray = Array.from(bundlesMap.values())

      statuses.forEach((s) => {
        if (bundlesArray.some((bundle) => bundle[`is${s.charAt(0).toUpperCase() + s.slice(1)}`])) {
          status.push(s)
        }
      })
      if (status.length === 0 && bundlesArray.length > 0) {
        status.push('active')
      }
    }
    tableData.push({ version, status })
  })

  return [versionsMap, tableData]
}

// returns map of unique bundles for addons and versions
export const getUniqueBundlesForAddonsAndVersions = (data, addons = [], versions = []) => {
  const result = new Map()

  addons.forEach((addonName) => {
    if (data.has(addonName)) {
      const versionsMap = data.get(addonName)
      versionsMap.forEach((bundlesMap, version) => {
        if (versions.includes(addonName + ' ' + version)) {
          bundlesMap.forEach((bundle, bundleName) => {
            if (!result.has(bundleName)) {
              result.set(bundleName, bundle)
            }
          })
        }
      })
    }
  })

  return result
}

// bundles: map of the bundles
export const transformBundlesTable = (data, addons = [], versions = []) => {
  const bundlesMap = getUniqueBundlesForAddonsAndVersions(data, addons, versions)

  if (!bundlesMap) return []

  let tableData = []
  bundlesMap.forEach((bundle, bundleName) => {
    const status = []
    statuses.forEach((s) => {
      if (bundle[`is${s.charAt(0).toUpperCase() + s.slice(1)}`]) {
        status.push(s)
      }
    })
    tableData.push({ name: bundleName, status })
  })

  return tableData
}

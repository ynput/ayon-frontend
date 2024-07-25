import compare from 'semver/functions/compare'

export const transformAddonsWithBundles = (addons = [], bundles = []) => {
  const result = new Map()

  // we invert bundles to list addons by version and then by bundle
  bundles.forEach((item) => {
    Object.entries(item.addons).forEach(([addonName, version]) => {
      if (!result.has(addonName)) {
        // create empty array for versions
        result.set(addonName, new Map())
      }
      if (!result.get(addonName).has(version)) {
        // create empty array for bundles
        result.get(addonName).set(version, { bundles: new Map() })
      }
      result.get(addonName).get(version)?.bundles?.set(item.name, item)
    })
  })

  // merge in remaining addons and versions from addons (these are versions that are not in bundles)
  addons.forEach((addon) => {
    Object.entries(addon.versions).forEach(([versionName, version]) => {
      if (!result.has(addon.name)) {
        // create empty array for versions
        result.set(addon.name, new Map())
      }
      if (!result.get(addon.name).has(versionName)) {
        // add version and create empty array for bundles
        result.get(addon.name).set(versionName, { bundles: new Map(), ...version })
      } else {
        // merge version with existing version
        result
          .get(addon.name)
          .set(versionName, { ...result.get(addon.name).get(versionName), ...version })
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
          versionsArray.some((version) =>
            Array.from(version.bundles.values()).some(
              (bundle) => bundle[`is${s.charAt(0).toUpperCase() + s.slice(1)}`],
            ),
          )
        ) {
          status.push(s)
        }
      })
      if (status.length === 0 && versionsArray.some((v) => v.bundles?.size > 0)) {
        status.push('active')
      }
      // check if any of the versions are broken
      if (versionsArray.some((v) => v.isBroken)) {
        status.push('error')
      }
    }
    tableData.push({ name: addonName, status })
  })
  return tableData
}

// data: map of the addons, versions, bundles
// get map of unique versions for addons
export const getVersionsForAddons = (data, addons = []) => {
  const result = new Map()

  addons.forEach((addonName) => {
    if (data.has(addonName)) {
      const versionsMap = data.get(addonName)
      versionsMap.forEach((version, versionName) => {
        if (!result.has(versionName)) {
          result.set(addonName + ' ' + versionName, version)
        }
      })
    }
  })

  return result
}

// versions: maps of the versions
export const transformVersionsTable = (data, addons = [], deletedVersions) => {
  const versionSort = (sortOrder) => (a, b) => {
    const aVersion = a.version.split(' ')[1]
    const bVersion = b.version.split(' ')[1]
    const compareResult = compare(aVersion, bVersion)
    return sortOrder === 1 ? compareResult : -1 * compareResult
  }

  const versionsMap = getVersionsForAddons(data, addons)

  if (!versionsMap) return []

  let tableData = []
  versionsMap.forEach((version, versionName) => {
    let status = [],
      tooltip,
      suffix
    if (deletedVersions.includes(versionName)) {
      status.push('error')
      suffix = '(deleted)'
      tooltip = 'Restarting the server will remove it from the list.'
    } else {
      const bundlesArray = Array.from(version.bundles?.values())

      statuses.forEach((s) => {
        if (bundlesArray.some((bundle) => bundle[`is${s.charAt(0).toUpperCase() + s.slice(1)}`])) {
          status.push(s)
        }
      })
      if (status.length === 0 && bundlesArray.length > 0) {
        status.push('active')
      }
      // check if version is broken
      if (version.isBroken) {
        status.push('error')
        suffix = '(broken)'
        tooltip = 'Addon failed to load. Check logs for details' //JSON.stringify(version.reason)
        // TODO: allow rendering reason in pre or markdown
      }
    }

    tableData.push({ version: versionName, status, tooltip, suffix })
  })
  tableData.sort(versionSort(-1))
  return [versionsMap, tableData, versionSort]
}

// returns map of unique bundles for addons and versions
export const getUniqueBundlesForAddonsAndVersions = (data, addons = [], versions = []) => {
  const result = new Map()

  addons.forEach((addonName) => {
    if (data.has(addonName)) {
      const versionsMap = data.get(addonName)
      versionsMap.forEach((version, versionName) => {
        if (versions.includes(addonName + ' ' + versionName)) {
          version.bundles?.forEach((bundle, bundleName) => {
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

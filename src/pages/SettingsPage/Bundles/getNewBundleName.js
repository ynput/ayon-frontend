// new bundles name format [studio-name]-[YYYY]-[MM]-[DD]-[xx]
// xx is a number that increments for each bundle created on the same day

const getNewBundleName = (studioName, bundleList = []) => {
  const defaultStudio = 'Studio-Name'
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')

  const baseName = `${studioName || defaultStudio}-${year}-${month}-${day}`

  // check how many bundles names start with baseName
  const matchingBundles = bundleList.filter((bundle) => bundle?.name?.startsWith(baseName))
  const name = `${baseName}-${(matchingBundles.length + 1).toString().padStart(2, '0')}`

  return name
}

export default getNewBundleName

import { useMemo } from 'react'
import { useListBundlesQuery } from '@queries/bundles/getBundles'
import { coerce, compareBuild } from 'semver'
import { useLocalStorage } from '@shared/hooks'
import { toast } from 'react-toastify'
import { useListInstallersQuery } from '@queries/installers/getInstallers'

const useGetInstallerDownload = () => {
  const { data: { installers = [] } = {} } = useListInstallersQuery({})

  const { data: { bundles: bundleList = [] } = {} } = useListBundlesQuery({ archived: true })
  const production = useMemo(() => {
    return bundleList.find((bundle) => bundle.isProduction)
  }, [bundleList])

  const installerVersion = production?.installerVersion

  // Sort all installers by version using semver
  const sortedInstallers = useMemo(() => {
    return [...installers]
      .map((i) => ({ ...i, semver: coerce(i?.version) }))
      .sort((a, b) => {
        // If a doesn't have a valid version, sort it last
        if (!a.semver?.version) {
          return 1
        }
        // If b doesn't have a valid version, sort it last
        if (!b.semver?.version) {
          return -1
        }
        // If both have valid versions, compare them
        return (
          -1 * compareBuild(a.semver?.version, b.semver?.version) ||
          b.version.localeCompare(a.version)
        )
      })
  }, [installers])

  // Filter sorted installers into production installers
  const productionInstallers = useMemo(() => {
    return sortedInstallers.filter((installer) => installer.version === installerVersion)
  }, [sortedInstallers, installerVersion])

  // Function to group installers by platform
  const groupInstallersBy = (installers, key) => {
    return installers.reduce((acc, installer) => {
      if (!acc[installer[key]]) {
        acc[installer[key]] = []
      }
      acc[installer[key]].push(installer)
      return acc
    }, {})
  }

  // Use the function to group production and non-production installers
  const productionInstallersGroupedByPlatform = useMemo(
    () => groupInstallersBy(productionInstallers, 'platform'),
    [productionInstallers],
  )
  const allInstallersGroupedByPlatform = useMemo(
    () => groupInstallersBy(sortedInstallers, 'version'),
    [sortedInstallers],
  )

  // get operating system of user
  const userPlatform = useMemo(() => {
    const userAgent = window.navigator.userAgent
    if (userAgent.indexOf('Win') !== -1) {
      return 'windows'
    } else if (userAgent.indexOf('Linux') !== -1) {
      return 'linux'
    } else if (userAgent.indexOf('Mac') !== -1) {
      return 'darwin'
    } else {
      return 'unknown'
    }
  }, [])

  // in foundInstallerVersion, find the installer for the user's platform from sources
  const directDownload = useMemo(() => {
    // If there are no installer versions, return null
    if (!productionInstallers.length) return null

    // Find the installer that matches the user's platform
    const foundInstaller = productionInstallers.find(
      (installer) => installer.platform === userPlatform,
    )

    // If the found installer has no sources, return null
    if (!foundInstaller?.sources?.length) return null

    // Find the URL of the installer source that uses HTTP
    const foundInstallerUrl = foundInstaller.sources.find((source) => source.type === 'http')?.url

    // If an HTTP source URL is found, return an object with the URL and filename
    if (foundInstallerUrl) return { url: foundInstallerUrl, filename: foundInstaller.filename }

    // If no HTTP source URL is found, find the installer source that uses the server
    const foundInstallerFile = foundInstaller.sources.find((source) => source.type === 'server')

    // If a server source is found, build the download URL
    if (foundInstallerFile) {
      const url = `/api/desktop/installers/${foundInstaller.filename}`

      // If the URL is successfully built, return an object with the URL and filename
      if (url) return { url, filename: foundInstaller.filename }
    }

    // If no suitable source is found, return null
    return null
  }, [productionInstallers])

  const [installersDownloaded, setInstallersDownloaded] = useLocalStorage(
    'installers-downloaded',
    [],
  )

  const downloadFromUrl = (url, filename) => {
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
    // set localStorage
    setInstallersDownloaded([...installersDownloaded, filename])
  }

  const handleDownload = async (sources, filename) => {
    // find a source of type === 'server
    const serverSource = sources.find((source) => source.type === 'server')
    const urlSource = sources.find((source) => source.type === 'http')
    if (serverSource || urlSource) {
      const url = serverSource ? `/api/desktop/installers/${filename}` : urlSource.url
      // download the file
      downloadFromUrl(url, filename)
    } else {
      toast.error('URL for launcher not found')
    }
  }

  return {
    prodInstallers: productionInstallersGroupedByPlatform,
    allInstallers: allInstallersGroupedByPlatform,
    directDownload,
    platform: userPlatform,
    handleDownload,
  }
}

export default useGetInstallerDownload

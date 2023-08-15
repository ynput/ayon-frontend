import { Icon } from '@ynput/ayon-react-components'
import React, { useMemo } from 'react'
import { useGetInstallerListQuery } from '/src/services/installers'
import { toast } from 'react-toastify'
import useLocalStorage from '/src/hooks/useLocalStorage'
import * as Styled from './InstallerDownload.styled'
import { useGetBundleListQuery } from '/src/services/bundles'

const InstallerDownload = ({ isSpecial }) => {
  const [installerDownloaded, setInstallerDownloaded] = useLocalStorage(
    'installer-downloaded',
    false,
  )

  const { data: installers = [] } = useGetInstallerListQuery()

  const { data: bundleList = [] } = useGetBundleListQuery({ archived: true })
  const production = useMemo(() => {
    return bundleList.find((bundle) => bundle.isProduction)
  }, [bundleList])

  const installerVersion = production?.installerVersion
  // find installer version
  const foundInstallerVersions = useMemo(() => {
    return installers.filter((installer) => installer.version === installerVersion)
  }, [installers, installerVersion])

  // get operating system of user
  const userPlatform = React.useMemo(() => {
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
    if (!foundInstallerVersions.length) return null
    const foundInstaller = foundInstallerVersions.find(
      (installer) => installer.platform === userPlatform,
    )
    if (!foundInstaller?.sources?.length) return null
    const foundInstallerUrl = foundInstaller.sources.find((source) => source.type === 'url')?.url
    if (foundInstallerUrl) return { url: foundInstallerUrl, filename: foundInstaller.filename }
    const foundInstallerFile = foundInstaller.sources.find((source) => source.type === 'server')
    if (foundInstallerFile) {
      // build download url
      const url = `/api/desktop/installers/${foundInstaller.filename}?token=${localStorage.getItem(
        'accessToken',
      )}`
      if (url) return { url, filename: foundInstaller.filename }
    }
    return null
  }, [foundInstallerVersions])

  // put any direct downloads first and then use semver to sort the rest
  const sortedInstallers = useMemo(
    () => [...installers].sort((a, b) => (b.filename === directDownload?.filename ? 1 : -1)),
    [installers],
  )

  if (isSpecial && !directDownload) return null

  const downloadFromUrl = (url, filename) => {
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
    // set localStorage
    setInstallerDownloaded(filename)
  }

  const handleDownloadClick = async (sources, filename) => {
    // find a source of type === 'server
    const serverSource = sources.find((source) => source.type === 'server')
    const urlSource = sources.find((source) => source.type === 'url')
    if (serverSource || urlSource) {
      const url = serverSource
        ? `/api/desktop/installers/${filename}?token=${localStorage.getItem('accessToken')}`
        : urlSource.url
      // download the file
      downloadFromUrl(url, filename)
    } else {
      toast.error('URL for installer not found')
    }
  }

  const handleDirectDownload = () => {
    downloadFromUrl(directDownload.url, directDownload.filename)
  }

  if (isSpecial && installerDownloaded === directDownload.filename) return null

  return (
    <Styled.Container>
      {directDownload && (
        <Styled.DownloadButton
          $isSpecial={isSpecial}
          icon={'install_desktop'}
          onClick={handleDirectDownload}
        >
          Download Launcher
        </Styled.DownloadButton>
      )}
      {!isSpecial && (
        <Styled.InstallerDropdown
          $isSpecial={isSpecial}
          $noDirect={!directDownload}
          options={sortedInstallers}
          value={[]}
          valueTemplate={() => (
            <Styled.Value>
              {!directDownload && (
                <>
                  <Icon icon="install_desktop" />
                  <span>Download installers</span>
                </>
              )}
              <Icon icon="expand_more" />
            </Styled.Value>
          )}
          widthExpand
          align="right"
          itemTemplate={({ platform, filename, sources }) => (
            <Styled.Item
              $highlight={directDownload?.filename === filename}
              onClick={() => handleDownloadClick(sources, filename)}
            >
              <Icon icon="download" />
              <span>
                {platform === 'darwin' ? 'macOS' : platform} - {filename}
              </span>
            </Styled.Item>
          )}
          listStyle={{ left: isSpecial ? 28 : 0 }}
        />
      )}
      {isSpecial && (
        <Styled.CloseButton
          $isSpecial={true}
          icon="close"
          onClick={() => setInstallerDownloaded(true)}
        />
      )}
    </Styled.Container>
  )
}

export default InstallerDownload

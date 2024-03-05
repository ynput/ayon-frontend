import useGetInstallerDownload from '/src/components/InstallerDownload/useGetInstallerDownload'
import * as Styled from './DownloadsPage.styled'
import { Button, Panel, Section } from '@ynput/ayon-react-components'
import InstallerProdCard from '/src/components/InstallerDownload/InstallerProdCard/InstallerProdCard'
import useLocalStorage from '/src/hooks/useLocalStorage'
import { toast } from 'react-toastify'
import WindowsLogo from '/src/svg/WindowsLogo'
import AppleLogo from '/src/svg/AppleLogo'
import LinuxLogo from '/src/svg/LinuxLogo'

const getPlatformIcon = (platform) => {
  switch (platform) {
    case 'windows':
      return <WindowsLogo />

    case 'darwin':
      return <AppleLogo />

    case 'linux':
      return <LinuxLogo />

    default:
      return null
  }
}

const DownloadsPage = () => {
  const [installersDownloaded, setInstallersDownloaded] = useLocalStorage(
    'installers-downloaded',
    [],
  )
  //  production installers grouped by platform
  //  non-production installers grouped by version
  const [productionDownloads = {}, nonProductionDownloads = {}, , platform] =
    useGetInstallerDownload()

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

  const handleDownloadClick = async (sources, filename) => {
    // find a source of type === 'server
    const serverSource = sources.find((source) => source.type === 'server')
    const urlSource = sources.find((source) => source.type === 'http')
    if (serverSource || urlSource) {
      const url = serverSource
        ? `/api/desktop/installers/${filename}?token=${localStorage.getItem('accessToken')}`
        : urlSource.url
      // download the file
      downloadFromUrl(url, filename)
    } else {
      toast.error('URL for launcher not found')
    }
  }

  const platforms = ['windows', 'darwin', 'linux']

  return (
    <main style={{ overflow: 'hidden' }}>
      <Section>
        <Styled.Container>
          <Styled.Header>
            {platforms.map((p) => (
              <InstallerProdCard
                key={p}
                platform={p}
                isFeatured={p === platform}
                installers={productionDownloads[p]}
                onInstall={(installer) =>
                  handleDownloadClick(installer.sources, installer.filename)
                }
              />
            ))}
          </Styled.Header>
          <Panel style={{ overflow: 'auto' }}>
            <h2>All Versions</h2>
            <Styled.All>
              {Object.entries(nonProductionDownloads).map(([version, installers]) => (
                <div key={version}>
                  <Styled.Installer variant="text">
                    <span>
                      {installers[0] && installers[0].filename?.split(version)[0] + version}
                    </span>
                    <Styled.Platforms>
                      {installers.map((installer) => (
                        <Button
                          key={installer.filename}
                          onClick={() => handleDownloadClick(installer.sources, installer.filename)}
                          variant="text"
                          style={{
                            order:
                              installer.platform === 'windows'
                                ? 0
                                : installer.platform === 'darwin'
                                ? 1
                                : 2,
                          }}
                        >
                          {getPlatformIcon(installer.platform)}
                        </Button>
                      ))}
                    </Styled.Platforms>
                  </Styled.Installer>
                </div>
              ))}
            </Styled.All>
          </Panel>
        </Styled.Container>
      </Section>
    </main>
  )
}

export default DownloadsPage

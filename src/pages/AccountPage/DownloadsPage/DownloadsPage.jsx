import useGetInstallerDownload from '@components/InstallerDownload/useGetInstallerDownload'
import * as Styled from './DownloadsPage.styled'
import { Button, Panel, Section } from '@ynput/ayon-react-components'
import InstallerProdCard from '@components/InstallerDownload/InstallerProdCard/InstallerProdCard'

import WindowsLogo from '@/svg/WindowsLogo'
import AppleLogo from '@/svg/AppleLogo'
import LinuxLogo from '@/svg/LinuxLogo'

export const getPlatformIcon = (platform) => {
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

export const getPlatformLabel = (platform) => {
  switch (platform) {
    case 'windows':
      return 'Windows'

    case 'darwin':
      return 'macOS'

    case 'linux':
      return 'Linux'

    default:
      return platform
  }
}

const DownloadsPage = () => {
  //  production installers grouped by platform
  //  non-production installers grouped by version
  const { prodInstallers, allInstallers, platform, handleDownload } = useGetInstallerDownload()

  const platforms = ['windows', 'darwin', 'linux']

  console.log(allInstallers)

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
                installers={prodInstallers[p]}
                onInstall={(installer) => handleDownload(installer.sources, installer.filename)}
              />
            ))}
          </Styled.Header>
          <Panel style={{ overflow: 'auto' }}>
            <h2>All Versions</h2>
            <Styled.All>
              {Object.entries(allInstallers).map(([version, installers]) => (
                <div key={version}>
                  <Styled.Installer variant="text">
                    <span>
                      {installers[0] && installers[0].filename?.split(version)[0] + version}
                    </span>
                    <Styled.Platforms>
                      {installers.map((installer) => (
                        <Button
                          key={installer.filename}
                          onClick={() => handleDownload(installer.sources, installer.filename)}
                          variant="text"
                          data-tooltip={installer.filename}
                          data-tooltip-delay={300}
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

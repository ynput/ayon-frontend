// shows the production installers available for download for a specific platform
import { classNames } from 'primereact/utils'
import * as Styled from './InstallerProdCard.styled'
import AppleLogo from '/src/svg/AppleLogo'
import LinuxLogo from '/src/svg/LinuxLogo'
import WindowsLogo from '/src/svg/WindowsLogo'
import { Button } from '@ynput/ayon-react-components'

const InstallerProdCard = ({ platform, isFeatured = false, installers = [], onInstall }) => {
  let title, icon

  switch (platform) {
    case 'windows':
      title = 'Windows'
      icon = <WindowsLogo />
      break
    case 'darwin':
      title = 'macOS'
      icon = <AppleLogo />
      break
    case 'linux':
      title = 'Linux'
      icon = <LinuxLogo />
      break
    default:
      title = 'Unknown'
      icon = null
  }

  return (
    <Styled.Card className={classNames({ featured: isFeatured })}>
      {icon}
      <h2>{title} Installer</h2>
      <Styled.DownloadLinks>
        {installers?.length ? (
          installers.map((installer) => (
            <Button
              key={installer.filename}
              onClick={() => onInstall(installer)}
              variant={isFeatured ? 'filled' : 'text'}
              icon={isFeatured ? 'install_desktop' : null}
            >
              {installer.filename}
            </Button>
          ))
        ) : (
          <Button disabled variant="text">
            None available
          </Button>
        )}
      </Styled.DownloadLinks>
    </Styled.Card>
  )
}

export default InstallerProdCard

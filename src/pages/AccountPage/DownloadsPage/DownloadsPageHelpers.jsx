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

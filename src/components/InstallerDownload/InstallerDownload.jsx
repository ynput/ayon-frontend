import { Dropdown, Icon } from '@ynput/ayon-react-components'
import React from 'react'
import styled, { css } from 'styled-components'
import { useGetInstallerListQuery } from '/src/services/installers'
import { toast } from 'react-toastify'

const StyledInstallerDownload = styled(Dropdown)`
  .button {
    background-color: var(--button-background);
    padding: 8px 12px;
    height: unset;

    &:hover {
      background-color: var(--button-background-hover);
    }
  }

  ${({ $isSpecial }) =>
    $isSpecial &&
    css`
      .button {
        background-color: var(--color-hl-00);
        &:hover {
          background-color: var(--color-hl-00);
        }
        &,
        .icon {
          color: black;
        }
      }
    `}
`

const StyledValue = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .icon {
    font-size: 1.5rem;
  }
`

const StyledItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 224px;
  padding: 8px 12px;
  .icon {
    font-size: 1.5rem;
  }

  ${({ $highlight }) =>
    $highlight &&
    css`
      &,
      .icon {
        color: var(--color-hl-00);
      }
    `}
`

const InstallerDownload = ({ isSpecial }) => {
  const { data: installers } = useGetInstallerListQuery()

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

  const handleDownloadClick = async (sources, filename) => {
    // find a source of type === 'server
    const serverSource = sources.find((source) => source.type === 'server')
    const urlSource = sources.find((source) => source.type === 'url')
    if (serverSource || urlSource) {
      const url = serverSource
        ? `/api/desktop/installers/${filename}?token=${localStorage.getItem('accessToken')}`
        : urlSource.url
      // download the file
      // const response = await fetch(url)
      // const blob = await response.blob()
      // const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      // set localStorage
      localStorage.setItem('installerDownloaded', 'true')
    } else {
      toast.error('URL for installer not found')
    }
  }

  if (isSpecial && localStorage.getItem('installerDownloaded') === 'true') return null

  return (
    <StyledInstallerDownload
      $isSpecial={isSpecial}
      options={installers}
      value={[]}
      valueTemplate={() => (
        <StyledValue>
          <Icon icon="install_desktop" />
          <span>Download Installers</span>
        </StyledValue>
      )}
      itemTemplate={({ platform, filename, sources }) => (
        <StyledItem
          $highlight={userPlatform === platform}
          onClick={() => handleDownloadClick(sources, filename)}
        >
          <Icon icon="download" />
          <span>
            {platform === 'darwin' ? 'macOS' : platform} - {filename}
          </span>
        </StyledItem>
      )}
    />
  )
}

export default InstallerDownload

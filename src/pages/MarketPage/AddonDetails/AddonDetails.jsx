import { Button, Icon, SaveButton } from '@ynput/ayon-react-components'
import React, { useState } from 'react'
import * as Styled from './AddonDetails.styled'
import Type from '/src/theme/typography.module.css'
import { classNames } from 'primereact/utils'
import { isEmpty } from 'lodash'
import AddonIcon from '/src/components/AddonIcon/AddonIcon'
import { rcompare } from 'semver'
import useUninstall from './useUninstall'
import useInstall from './useInstall'

const MetaPanelRow = ({ label, children }) => (
  <Styled.MetaPanelRow>
    <span className={classNames('label', Type.titleMedium)}>{label}</span>
    <span className="value">{children}</span>
  </Styled.MetaPanelRow>
)

const AddonDetails = ({ addon = {}, isLoading, onInstall }) => {
  // latestVersion: is the latest version of the addon
  // versions: is an array of all versions INSTALLED of the addon
  const {
    name,
    title,
    description,
    icon,
    isInstalled,
    isInstalling,
    isFinished,
    isOutdated,
    // versions = [],
    installedVersions = {},
    latestVersion,
    currentProductionVersion,
    orgTitle,
    isVerified,
    isOfficial,
  } = addon

  const [showAllVersions, setShowAllVersions] = useState(false)

  const versionKeys = isEmpty(installedVersions) ? [] : Object.keys(installedVersions)
  const versionKeysSorted = versionKeys.sort((a, b) => rcompare(a, b))
  const versionsToShow = versionKeysSorted.length
    ? showAllVersions
      ? versionKeysSorted
      : versionKeysSorted.slice(0, 2)
    : []
  const nOfMoreVersions = versionKeysSorted.length - versionsToShow.length

  let verifiedString = 'Unverified'
  if (isVerified && !isOfficial) verifiedString = 'Verified'
  if (isOfficial) verifiedString = 'Official'

  let verifiedIcon = <Icon icon="public" />
  if (isVerified && !isOfficial) verifiedIcon = <Icon icon="new_releases" />
  if (isOfficial) verifiedIcon = <img src="/favicon-32x32.png" width={15} height={15} />

  // sets selected addon and redirects to addons
  const { onUninstall } = useUninstall(name)

  const { installAddon } = useInstall(name, latestVersion, onInstall)

  let actionButton = null

  if (isInstalling) {
    actionButton = (
      <SaveButton active saving disabled>
        Installing...
      </SaveButton>
    )
  } else if (isFinished) {
    actionButton = (
      <Button disabled icon={'check_circle'}>
        Installed!
      </Button>
    )
  } else if (isInstalled && !isOutdated) {
    actionButton = <Button onClick={onUninstall}>Uninstall</Button>
  } else if (isInstalled && isOutdated) {
    actionButton = (
      <Button
        variant="filled"
        icon={'upgrade'}
        onClick={installAddon}
      >{`Update to v${latestVersion}`}</Button>
    )
  } else {
    actionButton = (
      <Button variant="filled" icon={'download_for_offline'} onClick={installAddon}>
        Install
      </Button>
    )
  }

  return (
    <Styled.PanelContainer direction="row" className={classNames({ noData: !name })}>
      {name && (
        <>
          <Styled.Left className={Type.bodyLarge}>
            <Styled.Header className={classNames({ isPlaceholder: isLoading })}>
              <AddonIcon size={64} src={icon} alt={name + ' icon'} isPlaceholder={isLoading} />
              <div className="titles">
                <h2 className={Type.headlineSmall}>{title}</h2>
                <span className={classNames(verifiedString.toLowerCase(), 'verification')}>
                  {verifiedIcon}
                  {verifiedString}
                </span>
              </div>
            </Styled.Header>
            <Styled.Description className={classNames({ isPlaceholder: isLoading })}>
              {description}
            </Styled.Description>
          </Styled.Left>
          {/* RIGHT PANEL */}
          <Styled.Right className={classNames(Type.bodyMedium, { isLoading })}>
            {actionButton}
            <Styled.MetaPanel className={classNames({ isPlaceholder: isLoading })}>
              <MetaPanelRow label="Installed Versions">
                {versionsToShow.length
                  ? versionsToShow.map((version) => <span key={version}>{version}</span>)
                  : 'Not installed'}
                {!!nOfMoreVersions && (
                  <span className="more" onClick={() => setShowAllVersions(true)}>
                    +{nOfMoreVersions} more
                  </span>
                )}
              </MetaPanelRow>
            </Styled.MetaPanel>
            <Styled.MetaPanel className={classNames({ isPlaceholder: isLoading })}>
              <MetaPanelRow label="Production Usage">
                {currentProductionVersion
                  ? `v${currentProductionVersion}`
                  : 'Not used in Production'}
              </MetaPanelRow>
            </Styled.MetaPanel>
            <Styled.MetaPanel className={classNames({ isPlaceholder: isLoading })}>
              <MetaPanelRow label="Author">{orgTitle}</MetaPanelRow>
              <MetaPanelRow label="Latest Version">v{latestVersion}</MetaPanelRow>
            </Styled.MetaPanel>
          </Styled.Right>
        </>
      )}
    </Styled.PanelContainer>
  )
}

export default AddonDetails

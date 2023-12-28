import { Button, Icon, SaveButton } from '@ynput/ayon-react-components'
import React, { useState } from 'react'
import * as Styled from './AddonDetails.styled'
import Type from '/src/theme/typography.module.css'
import { classNames } from 'primereact/utils'
import { isEmpty } from 'lodash'
import AddonIcon from '/src/components/AddonIcon/AddonIcon'
import { rcompare } from 'semver'
import useUninstall from './useUninstall'
import { Link } from 'react-router-dom'

const MetaPanelRow = ({ label, children, valueDirection = 'column', ...props }) => (
  <Styled.MetaPanelRow {...props}>
    <span className={classNames('label', Type.titleMedium)}>{label}</span>
    <span
      className="value"
      style={{
        flexDirection: valueDirection,
        alignItems: valueDirection === 'column' ? 'flex-start' : 'center',
        gap: valueDirection === 'column' ? '0' : 8,
      }}
    >
      {children}
    </span>
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
    isProductionOutdated,
    // versions = [],
    installedVersions = {},
    latestVersion,
    currentLatestVersion,
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
      : versionKeysSorted.slice(0, 1)
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

  // All the install logic is handled in the parent component (MarketPage.jsx)
  // Okay it's actually handled in the hook useInstall.js
  const handleInstall = () => {
    onInstall && onInstall(name, latestVersion)
  }

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
        onClick={handleInstall}
      >{`Update to v${latestVersion}`}</Button>
    )
  } else {
    actionButton = (
      <Button variant="filled" icon={'download_for_offline'} onClick={handleInstall}>
        {`Install v${latestVersion}`}
      </Button>
    )
  }

  // query string used for duplicating bundles with new version
  const addonVersionObject = { [name]: currentLatestVersion }
  const duplicateQueryString = encodeURIComponent(JSON.stringify(addonVersionObject))

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
              <MetaPanelRow label="Production Usage" valueDirection="row">
                <span>
                  {currentProductionVersion ? currentProductionVersion : 'Not used in Production'}
                </span>
                {currentProductionVersion &&
                  (isProductionOutdated ? (
                    <Link
                      to={`/settings/bundles?duplicate=prod&addon=${name}&versions=${duplicateQueryString}`}
                    >
                      <Styled.UseButton variant="tonal">
                        Use {currentLatestVersion}
                        <Icon icon="arrow_forward" />
                      </Styled.UseButton>
                    </Link>
                  ) : (
                    <Link to={`/settings/bundles?bundle=prod&addon=${name}`}>
                      <Styled.UseButton variant="tonal">
                        Bundle
                        <Icon icon="arrow_forward" />
                      </Styled.UseButton>
                    </Link>
                  ))}
              </MetaPanelRow>
            </Styled.MetaPanel>
            <Styled.MetaPanel className={classNames({ isPlaceholder: isLoading })}>
              <MetaPanelRow label="Author">{orgTitle}</MetaPanelRow>
              <MetaPanelRow label="Latest Version">{latestVersion}</MetaPanelRow>
            </Styled.MetaPanel>
          </Styled.Right>
        </>
      )}
    </Styled.PanelContainer>
  )
}

export default AddonDetails

import { Button, Icon, SaveButton } from '@ynput/ayon-react-components'
import React, { useState } from 'react'
import * as Styled from './AddonDetails.styled'
import Type from '@/theme/typography.module.css'
import { classNames } from 'primereact/utils'
import { isEmpty } from 'lodash'
import AddonIcon from '@components/AddonIcon/AddonIcon'
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

const AddonDetails = ({ addon = {}, isLoading, onInstall, isUpdatingAll }) => {
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
    isFailed,
    error,
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
    warning,
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

  // Install button (top right)
  if (isInstalling) {
    actionButton = (
      <SaveButton active saving disabled>
        Downloading...
      </SaveButton>
    )
  } else if (isFinished) {
    actionButton = (
      <Button disabled icon={'check_circle'}>
        Downloaded !
      </Button>
    )
  } else if (isUpdatingAll) {
    actionButton = (
      <Button active saving disabled>
        Pending...
      </Button>
    )
  } else if (isInstalled && !isOutdated) {
    actionButton = <Button onClick={onUninstall}>Uninstall</Button>
  } else if (isInstalled && isOutdated && latestVersion) {
    actionButton = (
      <Button
        variant="filled"
        icon={'download'}
        onClick={handleInstall}
      >{`Download v${latestVersion}`}</Button>
    )
  } else if (latestVersion) {
    actionButton = (
      <Button variant="filled" icon={'download'} onClick={handleInstall}>
        {`Download v${latestVersion}`}
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
            {isFailed && (
              <Styled.ErrorCard direction="row">
                <Icon icon="error_outline" />
                <span>{error || 'Download failed: check the events viewer or try again.'}</span>
                <a
                  href="https://github.com/ynput/ayon-frontend/issues/new?labels=bug&template=bug_report.md&title=Addon+failed+to+download"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Button variant="danger">Report</Button>
                </a>
              </Styled.ErrorCard>
            )}
            <Styled.Description className={classNames({ isPlaceholder: isLoading })}>
              {description}
            </Styled.Description>
          </Styled.Left>
          {/* RIGHT PANEL */}
          <Styled.Right className={classNames(Type.bodyMedium, { isLoading })}>
            {actionButton}
            <Styled.MetaPanel className={classNames({ isPlaceholder: isLoading })}>
              <MetaPanelRow label="Downloaded Versions">
                {versionsToShow.length
                  ? versionsToShow.map((version) => <span key={version}>{version}</span>)
                  : 'Not downloaded'}
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
              <MetaPanelRow label="Latest Version">
                {latestVersion && <p>{latestVersion}</p>}
                {warning && <p>{warning}</p>}
              </MetaPanelRow>
            </Styled.MetaPanel>
          </Styled.Right>
        </>
      )}
    </Styled.PanelContainer>
  )
}

export default AddonDetails

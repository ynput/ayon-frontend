import { Button, Icon } from '@ynput/ayon-react-components'
import React, { useState } from 'react'
import * as Styled from './AddonDetails.styled'
import Type from '/src/theme/typography.module.css'
import { classNames } from 'primereact/utils'
import { isEmpty } from 'lodash'
import AddonIcon from '/src/components/AddonIcon/AddonIcon'

const MetaPanelRow = ({ label, children }) => (
  <Styled.MetaPanelRow>
    <span className={classNames('label', Type.titleMedium)}>{label}</span>
    <span className="value">{children}</span>
  </Styled.MetaPanelRow>
)

const AddonDetails = ({ addon = {} }) => {
  // latestVersion: is the latest version of the addon
  // versions: is an array of all versions INSTALLED of the addon
  const {
    name,
    title,
    description,
    icon,
    isInstalled,
    isOutdated,
    // versions = [],
    installedVersions = {},
    latestVersion,
    productionVersion, // which version is running in production
    orgTitle,
    isVerified,
    isOfficial,
  } = addon

  const [showAllVersions, setShowAllVersions] = useState(false)

  const versionKeys = isEmpty(installedVersions) ? [] : Object.keys(installedVersions)
  const versionsToShow = versionKeys.length
    ? showAllVersions
      ? versionKeys
      : versionKeys.slice(0, 2)
    : []
  const nOfMoreVersions = versionKeys.length - versionsToShow.length

  let verifiedString = 'Unverified'
  if (isVerified && !isOfficial) verifiedString = 'Verified'
  if (isOfficial) verifiedString = 'Official'

  let verifiedIcon = <Icon icon="public" />
  if (isVerified && !isOfficial) verifiedIcon = <Icon icon="new_releases" />
  if (isOfficial) verifiedIcon = <img src="/favicon-32x32.png" width={15} height={15} />

  return (
    <Styled.PanelContainer direction="row" className={classNames({ noData: !name })}>
      {name && (
        <>
          <Styled.Left className={Type.bodyLarge}>
            <Styled.Header>
              <AddonIcon size={64} src={icon} alt={name + ' icon'} />
              <div className="titles">
                <h2 className={Type.headlineSmall}>{title}</h2>
                <span className={classNames(verifiedString.toLowerCase(), 'verification')}>
                  {verifiedIcon}
                  {verifiedString}
                </span>
              </div>
            </Styled.Header>
            <Styled.Description>{description}</Styled.Description>
          </Styled.Left>
          {/* RIGHT PANEL */}
          <Styled.Right className={Type.bodyMedium}>
            {isInstalled && !isOutdated && <Button>Uninstall</Button>}
            {isInstalled && isOutdated && (
              <Button variant="filled" icon={'upgrade'}>{`Update to v${latestVersion}`}</Button>
            )}
            {!isInstalled && (
              <Button variant="filled" icon="download_for_offline">
                Install
              </Button>
            )}
            <Styled.MetaPanel>
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
            <Styled.MetaPanel>
              <MetaPanelRow label="Production Usage">
                {productionVersion ? `Version: v${productionVersion}` : 'Not used in Production'}
              </MetaPanelRow>
            </Styled.MetaPanel>
            <Styled.MetaPanel>
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

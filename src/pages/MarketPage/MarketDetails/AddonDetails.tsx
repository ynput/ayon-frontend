import { Button, Icon, SaveButton } from '@ynput/ayon-react-components'
import { useEffect, useMemo, useState } from 'react'
import * as Styled from './MarketDetails.styled'
import Type from '@/theme/typography.module.css'
import clsx from 'clsx'
import { capitalize, isEmpty } from 'lodash'
import AddonIcon from '@components/AddonIcon/AddonIcon'
import { rcompare } from 'semver'
import useUninstall from './useUninstall'
import { Link } from 'react-router-dom'
import { getSimplifiedUrl } from '@helpers/url'
import ReactMarkdown from 'react-markdown'
import { AddonDetail, LinkModel } from '@api/rest/market'
import MetaPanelRow from './MetaPanelRow'
import remarkGfm from 'remark-gfm'
import emoji from 'remark-emoji'
import SubChip from '@components/SubChip/SubChip'
import { PricingLink } from '@components/PricingLink'

type ExtendedAddonDetail = AddonDetail & {
  downloadedVersions: Record<string, string>
  currentLatestVersion: string
  currentProductionVersion: string
  isProductionOutdated: boolean
  isVerified: boolean
  isOfficial: boolean
  warning: string
  isDownloaded: boolean
  isDownloading: boolean
  isFinished: boolean
  isFailed: boolean
  error: string
  flags: string[]
}

type AddonDetailsProps = {
  addon: ExtendedAddonDetail
  isLoading: boolean
  onDownload: (name: string, version: string) => void
  isUpdatingAll: boolean
}

const AddonDetails = ({ addon, isLoading, onDownload, isUpdatingAll }: AddonDetailsProps) => {
  // latestVersion: is the latest version of the addon
  // versions: is an array of all versions DOWNLOADED of the addon
  const {
    name,
    title,
    description,
    icon,
    links,
    isDownloaded,
    isDownloading,
    isFinished,
    isFailed,
    error,
    isOutdated,
    isProductionOutdated,
    versions = [],
    downloadedVersions = {},
    latestVersion,
    currentLatestVersion,
    currentProductionVersion,
    orgTitle,
    isVerified,
    isOfficial,
    warning,
    flags,
    available,
  } = addon || {}

  const versionKeys = isEmpty(downloadedVersions) ? [] : Object.keys(downloadedVersions)
  // keep track of downloaded versions
  const [downloadedByAddon, setDownloadedByAddon] = useState<Record<string, string[]>>({})
  const downloaded = downloadedByAddon[name] || []

  useEffect(() => {
    setDownloadedByAddon((v) => ({
      ...v,
      [name]: [...new Set([...(v[name] || []), ...versionKeys])],
    }))
  }, [name, setDownloadedByAddon])

  const [showAllVersions, setShowAllVersions] = useState(false)

  const versionKeysSorted = downloaded.sort((a, b) => rcompare(a, b))
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

  // All the download logic is handled in the parent component (MarketPage.jsx)
  // Okay it's actually handled in the hook useDownload.js
  const handleDownload = (version: string) => {
    onDownload && onDownload(name, version)
    // update downloaded versions
    if (!downloaded.includes(version)) {
      setDownloadedByAddon((v) => ({ ...v, [name]: [...(v[name] || []), version] }))
    }
  }

  let groupedLinks: {
    type: LinkModel['type']
    links: LinkModel[]
  }[] = []
  if (links) {
    links.forEach((link) => {
      let group = groupedLinks.find((el) => el.type == link.type)
      if (group != undefined) {
        group.links.push(link)
        return
      }

      groupedLinks.push({ type: link.type, links: [link] })
    })
  }

  let actionButton = null
  const subRequired = flags?.includes('licensed') && !available

  // Download button (top right)
  if (isDownloading) {
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
    actionButton = <Button disabled>Pending...</Button>
  } else if (isDownloaded && !isOutdated) {
    actionButton = <Button onClick={onUninstall}>Uninstall</Button>
  } else if (isDownloaded && isOutdated && latestVersion) {
    actionButton = (
      <Button
        variant="filled"
        icon={'download'}
        onClick={() => handleDownload(latestVersion)}
      >{`Download v${latestVersion}`}</Button>
    )
  } else if (latestVersion) {
    actionButton = (
      <Button variant="filled" icon={'download'} onClick={() => handleDownload(latestVersion)}>
        {`Download v${latestVersion}`}
      </Button>
    )
  } else if (subRequired) {
    actionButton = (
      <PricingLink style={{ width: '100%' }}>
        <Button variant="tertiary" style={{ width: '100%' }}>
          Subscribe
        </Button>
      </PricingLink>
    )
  }

  const versionsOptions = useMemo(
    () =>
      versions.map((v) => ({
        value: v.version,
        label: `v${v.version}`,
        isDownloaded: downloaded.includes(v.version),
      })),
    [versions, downloaded],
  )

  // query string used for duplicating bundles with new version
  const addonVersionObject = { [name]: currentLatestVersion }
  const duplicateQueryString = encodeURIComponent(JSON.stringify(addonVersionObject))

  return (
    <Styled.PanelContainer direction="row" className={clsx({ noData: !name })}>
      {name && (
        <>
          <Styled.Left className={Type.bodyLarge}>
            <Styled.Header className={clsx({ loading: isLoading })}>
              <AddonIcon size={64} src={icon} alt={name + ' icon'} isPlaceholder={isLoading} />
              <div className="titles">
                <h2 className={Type.headlineSmall}>{title} </h2>
                <span className={clsx(verifiedString.toLowerCase(), 'verification')}>
                  {verifiedIcon}
                  {verifiedString}
                </span>
              </div>
            </Styled.Header>
            {(flags?.includes('licensed') || flags?.includes('beta')) && !isLoading && (
              <Styled.Tags>
                {flags?.includes('licensed') && (
                  <SubChip includedWithPro={flags.includes('power-feature')} />
                )}
                {flags?.includes('beta') && (
                  <Styled.BetaTag data-tooltip="This addon is in beta and may have bugs or incomplete features.">
                    Early preview
                  </Styled.BetaTag>
                )}
              </Styled.Tags>
            )}
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
            <div className="description">
              <ReactMarkdown
                className={clsx({ loading: isLoading })}
                remarkPlugins={[remarkGfm, emoji]}
              >
                {description}
              </ReactMarkdown>
            </div>
          </Styled.Left>
          {/* RIGHT PANEL */}
          <Styled.Right className={clsx(Type.bodyMedium)}>
            <Styled.Download className={clsx({ loading: isLoading })}>
              {actionButton}

              {!!versionsOptions.length && (
                <Styled.VersionDropdown
                  options={versionsOptions}
                  align="right"
                  value={[]}
                  widthExpand
                  onChange={(v) => handleDownload(v[0])}
                  itemStyle={{ justifyContent: 'space-between' }}
                  // @ts-expect-error
                  buttonProps={{ 'data-tooltip': 'Download a specific version' }}
                  search={versions.length > 10}
                  itemTemplate={(option) => (
                    <Styled.VersionDropdownItem>
                      <Icon icon={option.isDownloaded ? 'check' : 'download'} />
                      {option.label}
                    </Styled.VersionDropdownItem>
                  )}
                />
              )}
            </Styled.Download>
            <Styled.MetaPanel className={clsx({ loading: isLoading })}>
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
            <Styled.MetaPanel className={clsx({ loading: isLoading })}>
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

            <Styled.MetaPanel className={clsx({ loading: isLoading })}>
              <MetaPanelRow label="Author">{orgTitle}</MetaPanelRow>
              <MetaPanelRow label="Latest Version">
                {latestVersion && <span>{latestVersion}</span>}
                {warning && <span>{warning}</span>}
              </MetaPanelRow>
            </Styled.MetaPanel>

            {groupedLinks.length > 0 && (
              <Styled.MetaPanel className={clsx({ loading: isLoading })}>
                {groupedLinks.map((group) => (
                  <MetaPanelRow
                    className="capitalized"
                    key={group.type}
                    label={capitalize(group.type)}
                  >
                    {group.links.map((link) => (
                      <Styled.ExternalLInk
                        href={link.url}
                        key={link.label}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="label"> {link.label || getSimplifiedUrl(link.url)} </span>
                        <Icon icon="open_in_new" />
                      </Styled.ExternalLInk>
                    ))}
                  </MetaPanelRow>
                ))}
              </Styled.MetaPanel>
            )}
          </Styled.Right>
        </>
      )}
    </Styled.PanelContainer>
  )
}

export default AddonDetails

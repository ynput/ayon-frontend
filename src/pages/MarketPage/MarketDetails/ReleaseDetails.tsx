import { Button, Icon, SaveButton } from '@ynput/ayon-react-components'
import * as Styled from './MarketDetails.styled'
import Type from '@/theme/typography.module.css'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import MetaPanelRow from './MetaPanelRow'
import { ReleaseInfoModel, ReleaseListItemModel } from '@api/rest/releases'
import { format } from 'date-fns'
import CloudButton from '@components/CloudButton'

type ExtendedReleaseDetail = ReleaseInfoModel & {
  icon: ReleaseListItemModel['icon']
  bio: ReleaseListItemModel['bio']
  isActive: boolean // can the the release be installed
}

type ReleaseDetailsProps = {
  release: ExtendedReleaseDetail
  isLoading: boolean
}

const ReleaseDetails = ({ release, isLoading }: ReleaseDetailsProps) => {
  // latestVersion: is the latest version of the addon
  // versions: is an array of all versions DOWNLOADED of the addon
  const { name, label, createdAt, icon, bio, isActive, addons } = release || {}

  const verifiedString = 'Official'
  const verifiedIcon = <img src="/favicon-32x32.png" width={15} height={15} />

  const isFailed = false
  const error = 'Download failed: check the events viewer or try again.'

  return (
    <Styled.PanelContainer direction="row" className={clsx({ noData: !name })}>
      {name && (
        <>
          <Styled.Left className={Type.bodyLarge}>
            <Styled.Header className={clsx({ loading: isLoading })}>
              <Icon icon={icon || 'order'} />
              <div className="titles">
                <h2 className={Type.headlineSmall}>{label}</h2>
                <span className={clsx(verifiedString.toLowerCase(), 'verification')}>
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
            <ReactMarkdown className={clsx({ loading: isLoading })}>{bio}</ReactMarkdown>
            <Styled.ReleaseAddons>
              {addons?.map((addon) => (
                <Styled.ReleaseAddon key={addon.name} className={clsx({ loading: isLoading })}>
                  <span>{addon.name}</span>
                </Styled.ReleaseAddon>
              ))}
            </Styled.ReleaseAddons>
          </Styled.Left>
          {/* RIGHT PANEL */}
          <Styled.Right className={clsx(Type.bodyMedium)}>
            <Styled.Download className={clsx({ loading: isLoading })}>
              {isActive ? (
                <SaveButton active icon="download">
                  Install release bundle
                </SaveButton>
              ) : (
                <CloudButton
                  featureId="release-installer"
                  data-tooltip="Subscribe to Ynput Cloud to install previous releases"
                  data-tooltip-delay={0}
                >
                  Install release bundle
                </CloudButton>
              )}
            </Styled.Download>
            <Styled.MetaPanel className={clsx({ loading: isLoading })}>
              <MetaPanelRow label="Author" valueDirection="row">
                <span>Ynput</span>
              </MetaPanelRow>
              <MetaPanelRow label="Released" valueDirection="row">
                <span>{createdAt ? format(new Date(createdAt), 'd / MM / y') : 'Unknown'}</span>
              </MetaPanelRow>
            </Styled.MetaPanel>
          </Styled.Right>
        </>
      )}
    </Styled.PanelContainer>
  )
}

export default ReleaseDetails

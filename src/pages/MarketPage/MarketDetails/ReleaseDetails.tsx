import { Button, Icon, SaveButton } from '@ynput/ayon-react-components'
import * as Styled from './MarketDetails.styled'
import Type from '@/theme/typography.module.css'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import MetaPanelRow from './MetaPanelRow'
import { ReleaseListItemModel } from '@shared/api'
import { format } from 'date-fns'
import AddonIcon from '@components/AddonIcon/AddonIcon'
import { PowerpackButton } from '@shared/components/Powerpack'

type ExtendedReleaseDetail = ReleaseListItemModel & {
  isActive: boolean // can the the release be installed
}

type ReleaseDetailsProps = {
  release: ExtendedReleaseDetail
  isLoading: boolean
  onDownload: (name: string) => void
}

const ReleaseDetails = ({ release, isLoading, onDownload }: ReleaseDetailsProps) => {
  // latestVersion: is the latest version of the addon
  // versions: is an array of all versions DOWNLOADED of the addon
  const { name, label, createdAt, icon, description, isActive, addons } = release || {}

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
              <AddonIcon size={64} icon={icon} alt={name + ' icon'} isPlaceholder={isLoading} />
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
            <ReactMarkdown className={clsx({ loading: isLoading })}>{description}</ReactMarkdown>
            <Styled.ReleaseAddons>
              {addons?.map((addon) => (
                <Styled.ReleaseAddonLink
                  to={`/market?selected=${addon}&type=addons`}
                  key={addon}
                  className={clsx({ loading: isLoading })}
                >
                  {addon}
                </Styled.ReleaseAddonLink>
              ))}
            </Styled.ReleaseAddons>
          </Styled.Left>
          {/* RIGHT PANEL */}
          <Styled.Right className={clsx(Type.bodyMedium)}>
            <Styled.Download className={clsx({ loading: isLoading })}>
              {isActive ? (
                <SaveButton active icon="download" onClick={() => onDownload(name)}>
                  Install release bundle
                </SaveButton>
              ) : (
                <PowerpackButton feature="releases">Install release bundle</PowerpackButton>
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

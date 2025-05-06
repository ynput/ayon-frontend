import { useGetYnputCloudInfoQuery } from '@queries/cloud/cloud'
import { useGetLicensesQuery } from '@queries/market/getMarket'
import { Button, Dialog, Icon, theme } from '@ynput/ayon-react-components'
import { FC, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { copyToClipboard } from '@shared/util'
import clsx from 'clsx'
import { YnputCloudInfoModel } from '@shared/api'
import { fromUnixTime, format } from 'date-fns'
import EmptyPlaceholder from '@shared/components/EmptyPlaceholder'

const Container = styled.div`
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: 8px;
  padding: 1rem;
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: var(--base-gap-medium);
  gap: var(--base-gap-large);
  min-height: 38px;

  .key {
    opacity: 0.7;
    text-transform: capitalize;
    min-width: 100px;
  }

  .value {
    text-align: right;
    flex: 1;
    border-radius: var(--border-radius-m);

    &.loading {
      max-width: 40%;
    }
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
    .copy-icon {
      opacity: 1;
    }
  }

  .copy-icon {
    opacity: 0;
    cursor: pointer;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const LicensesContainer = styled(Container)`
  margin-top: var(--base-gap-large);
  overflow: auto;

  h3 {
    text-transform: capitalize;
    margin-bottom: var(--base-gap-small);
    opacity: 0.8;
    &.loading {
      max-width: 20%;
      border-radius: var(--border-radius-m);
    }
  }
`

const LicenseHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--base-gap-small);
  .sync {
    color: var(--md-sys-color-outline);
  }
`

const LicenseRow = styled(Row)`
  background-color: var(--md-sys-color-surface-container-lowest);
  margin-bottom: var(--base-gap-small);
  padding: var(--padding-m);

  .license-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;

    .loading {
      border-radius: var(--border-radius-m);
      &:first-child {
        max-width: 40%;
      }
      max-width: 30%;
      &:last-child {
        max-width: 20%;
      }
    }
  }

  .license-type {
    font-size: ${theme.labelSmall};
    opacity: 0.8;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .status-icon {
    padding: var(--padding-m);
    border-radius: 50%;
    cursor: pointer;
    &:hover {
      background-color: var(--md-sys-color-surface-container-hover);
    }
  }

  &.invalid .status-icon {
    color: var(--md-sys-color-error);
    &:hover {
      background-color: var(--md-sys-color-error-container);
    }
  }
`

const LICENSE_COUNT_KEY = 'ayon-licenses-count'

interface LicensesDialogProps {
  onClose: () => void
}

const LicensesDialog: FC<LicensesDialogProps> = ({ onClose }) => {
  const { data: cloud, isLoading: isLoadingCloud } = useGetYnputCloudInfoQuery(undefined)
  const {
    data: { licenses = [], syncedAt } = {},
    isFetching: isLoadingLicenses,
    refetch,
  } = useGetLicensesQuery({
    refresh: true,
  })

  // refetch every time the dialog is opened
  useEffect(() => {
    refetch()
  }, [refetch])

  // Get saved license count or fallback to 2
  const savedLicenseCount = Number(localStorage.getItem(LICENSE_COUNT_KEY)) || 2

  // Save license count when data is loaded
  useEffect(() => {
    if (licenses.length > 0 && savedLicenseCount !== licenses.length) {
      localStorage.setItem(LICENSE_COUNT_KEY, licenses.length.toString())
    }
  }, [licenses])

  const sortedLicenses = useMemo(() => {
    const typeOrder = {
      seats: 0,
      addon: 1,
      feature: 2,
    }
    return [...licenses].sort((a, b) => {
      return (
        (typeOrder[a.type as keyof typeof typeOrder] || 0) -
        (typeOrder[b.type as keyof typeof typeOrder] || 0)
      )
    })
  }, [licenses])

  // Cloud loading placeholder data
  const cloudPlaceholderFields: (keyof YnputCloudInfoModel)[] = [
    'instanceId',
    'instanceName',
    'orgId',
    'orgName',
  ]

  if (!cloud && !isLoadingCloud) {
    return (
      <Dialog
        isOpen
        onClose={onClose}
        size="lg"
        header="Instance and licenses"
        style={{ maxHeight: '90vh', minHeight: '50vh' }}
      >
        <Container>
          <EmptyPlaceholder message="Connect this instance to Ynput Cloud to get license information." />
        </Container>
      </Dialog>
    )
  }

  return (
    <Dialog
      isOpen
      onClose={onClose}
      size="lg"
      header="Instance and licenses"
      style={{ maxHeight: '90vh' }}
    >
      <a
        href={`https://ynput.cloud/org/${cloud?.orgName}/instances/${cloud?.instanceId}/billing`}
        target="_blank"
        rel="noreferrer"
        style={{ width: 'fit-content', marginBottom: 8 }}
      >
        <Button
          data-tooltip="Manage seat counts, billing information and plan options on your Ynput Cloud account."
          data-tooltip-delay={0}
        >
          Manage Subscriptions
        </Button>
      </a>
      <Container>
        {isLoadingCloud
          ? cloudPlaceholderFields.map((key) => (
              <Row key={key}>
                <span className="key">{key}:</span>
                <span className="value loading">placeholder</span>
              </Row>
            ))
          : cloud &&
            cloudPlaceholderFields.map((key) => (
              <Row key={key}>
                <span className="key">{key}:</span>
                <span className="value">{cloud[key]?.toString()}</span>
                <Icon
                  className="copy-icon"
                  icon="content_copy"
                  onClick={() => copyToClipboard(cloud[key]?.toString(), true)}
                />
              </Row>
            ))}
      </Container>

      {isLoadingLicenses ? (
        <LicensesContainer>
          <h3 className="loading">subscription name</h3>
          {Array.from({ length: savedLicenseCount }, (_, i) => (
            <LicenseRow key={i} className="loading no-shimmer">
              <div className="license-info">
                <span className="loading">name</span>
                <span className="license-type loading">
                  <Icon icon={'star'} />
                  License type
                </span>{' '}
              </div>
              <Icon className="status-icon loading" icon="check_circle" />
            </LicenseRow>
          ))}
        </LicensesContainer>
      ) : (
        <LicensesContainer>
          <LicenseHeader>
            <h3>Licenses</h3>
            <span className="sync">
              Synced: {syncedAt ? format(fromUnixTime(syncedAt), 'HH:mm:ss') : '--:--:--'}
            </span>
          </LicenseHeader>
          {sortedLicenses.map((license, i) => (
            <LicenseRow
              key={license.subject + i}
              className={clsx({
                valid: license.valid,
                invalid: !license.valid,
              })}
            >
              <div className="license-info">
                <span>{license.label}</span>
                <span className="license-type">
                  <Icon
                    icon={
                      license.type === 'addon'
                        ? 'extension'
                        : license.type === 'seats'
                        ? 'person'
                        : 'star'
                    }
                  />
                  {license.type === 'seats' && (
                    <span>
                      {license.subject === 'meteredUsers' ? 'Up to ' : ''}
                      {license.value}
                      {license.subject === 'eventHistory' ? ' days' : ' seats'}
                    </span>
                  )}
                  {license.type !== 'seats' && <span>{license.type}</span>}
                </span>
              </div>
              <Icon
                className="status-icon"
                icon={license.valid ? 'check_circle' : 'error'}
                data-tooltip={license.note}
                data-tooltip-delay={0}
              />
            </LicenseRow>
          ))}
        </LicensesContainer>
      )}
    </Dialog>
  )
}

export default LicensesDialog

import { useGetYnputCloudInfoQuery } from '@queries/cloud/cloud'
import { LicenseItem, useGetLicensesQuery } from '@queries/market/getMarket'
import { Dialog, Icon, theme } from '@ynput/ayon-react-components'
import { FC, useEffect } from 'react'
import styled from 'styled-components'
import copyToClipboard from '@helpers/copyToClipboard'
import clsx from 'clsx'
import { YnputConnectResponseModel } from '@api/rest/cloud'
import { differenceInDays, differenceInHours, fromUnixTime, format } from 'date-fns'

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

  .license-exp {
    font-size: ${theme.labelSmall};
    opacity: 0.8;
    &.warning {
      color: var(--md-sys-color-warning);
    }
    &.error {
      color: var(--md-sys-color-error);
    }
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

  &.urgent {
    border: 2px solid var(--md-sys-color-error);
    order: -1; // Move to top
  }
`

const LICENSE_COUNT_KEY = 'ayon-licenses-count'

interface LicensesDialogProps {
  onClose: () => void
}

const LicensesDialog: FC<LicensesDialogProps> = ({ onClose }) => {
  const { data: cloud, isLoading: isLoadingCloud } = useGetYnputCloudInfoQuery(undefined)
  const { data: licenses = [], isLoading: isLoadingLicenses } = useGetLicensesQuery({})

  // Get saved license count or fallback to 2
  const savedLicenseCount = Number(localStorage.getItem(LICENSE_COUNT_KEY)) || 2

  // Save license count when data is loaded
  useEffect(() => {
    if (licenses.length > 0 && savedLicenseCount !== licenses.length) {
      localStorage.setItem(LICENSE_COUNT_KEY, licenses.length.toString())
    }
  }, [licenses])

  const formatDate = (timestamp: number) => {
    return format(fromUnixTime(timestamp), 'dd/MM/yyyy')
  }

  const getTimeRemaining = (timestamp: number) => {
    const now = new Date()
    const exp = fromUnixTime(timestamp)
    const days = differenceInDays(exp, now)
    if (days > 0) return `${days} days`

    const hours = differenceInHours(exp, now)
    return `${hours} hours`
  }

  const formatExpiration = (timestamp: number) => {
    const timeLeft = getTimeRemaining(timestamp)
    return `${formatDate(timestamp)} - ${timeLeft} left`
  }

  const sortLicenses = (licenses: LicenseItem[]) => {
    return [...licenses].sort((a, b) => {
      const aHours = differenceInHours(fromUnixTime(a.exp), new Date())
      const bHours = differenceInHours(fromUnixTime(b.exp), new Date())

      // Only sort if one of the licenses is urgent (less than 24h)
      if (aHours < 24 && bHours >= 24) return -1
      if (bHours < 24 && aHours >= 24) return 1
      // If both are urgent, sort by hours
      if (aHours < 24 && bHours < 24) return aHours - bHours
      // Keep original order for non-urgent licenses
      return 0
    })
  }

  // Cloud loading placeholder data
  const cloudPlaceholderFields: (keyof YnputConnectResponseModel)[] = [
    'instanceId',
    'instanceName',
    'orgId',
    'orgName',
    'collectSaturatedMetrics',
    'managed',
  ]

  return (
    <Dialog
      isOpen
      onClose={onClose}
      size="lg"
      header="Instance and licenses"
      style={{ maxHeight: '90vh' }}
    >
      <Container>
        {isLoadingCloud
          ? cloudPlaceholderFields.map((key) => (
              <Row key={key}>
                <span className="key">{key}:</span>
                <span className="value loading">placeholder</span>
              </Row>
            ))
          : cloud &&
            Object.entries(cloud).map(
              ([key, value]) =>
                !['subscriptions'].includes(key) && (
                  <Row key={key}>
                    <span className="key">{key}:</span>
                    <span className="value">{value?.toString()}</span>
                    <Icon
                      className="copy-icon"
                      icon="content_copy"
                      onClick={() => copyToClipboard(value.toString(), true)}
                    />
                  </Row>
                ),
            )}
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
                </span>
                <span className="license-exp loading">Expires: 01/01/2024</span>
              </div>
              <Icon className="status-icon loading" icon="check_circle" />
            </LicenseRow>
          ))}
        </LicensesContainer>
      ) : (
        <LicensesContainer>
          {sortLicenses(licenses).map((license) => (
            <LicenseRow
              key={license.subject}
              className={clsx({
                valid: license.valid,
                invalid: !license.valid,
                urgent: differenceInHours(fromUnixTime(license.exp), new Date()) < 24,
              })}
            >
              <div className="license-info">
                <span>{license.label}</span>
                <span className="license-type">
                  <Icon
                    icon={
                      license.type === 'addon'
                        ? 'extension'
                        : license.type === 'core'
                        ? 'deployed_code'
                        : 'star'
                    }
                  />
                  {license.type}
                </span>
                <span
                  className={clsx('license-exp', {
                    warning: differenceInDays(fromUnixTime(license.exp), new Date()) <= 30,
                    error: differenceInDays(fromUnixTime(license.exp), new Date()) <= 7,
                  })}
                >
                  Expires: {formatExpiration(license.exp)}
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

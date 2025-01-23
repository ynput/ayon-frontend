import { useGetYnputCloudInfoQuery } from '@queries/cloud/cloud'
import { useGetLicensesQuery } from '@queries/market/getMarket'
import { Dialog, Icon, theme } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'
import copyToClipboard from '@helpers/copyToClipboard'
import clsx from 'clsx'

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

  .key {
    opacity: 0.7;
    text-transform: capitalize;
    min-width: 100px;
  }

  .value {
    text-align: right;
    flex: 1;
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

  h3 {
    text-transform: capitalize;
    margin-bottom: var(--base-gap-small);
    opacity: 0.8;
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

interface LicensesDialogProps {
  onClose: () => void
}

const LicensesDialog: FC<LicensesDialogProps> = ({ onClose }) => {
  const { data: cloud } = useGetYnputCloudInfoQuery(undefined)
  const { data: licenses = [] } = useGetLicensesQuery({})

  const licensesBySubscription = licenses.reduce((acc, license: any) => {
    const sub = license.subscription
    if (!acc[sub]) acc[sub] = []
    acc[sub].push(license)
    return acc
  }, {})

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  return (
    <Dialog
      isOpen
      onClose={onClose}
      size="lg"
      header="Instance and licenses"
      style={{ maxHeight: '80vh' }}
    >
      <Container>
        {cloud &&
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

      {Object.entries(licensesBySubscription).map(([subscription, subs]) => (
        <LicensesContainer key={subscription}>
          <h3>{subscription}</h3>
          {subs.map((license: any) => (
            <LicenseRow
              key={license.subject}
              className={clsx({
                valid: license.valid,
                invalid: !license.valid,
              })}
            >
              <div className="license-info">
                <span>{license.label}</span>
                <span className="license-type">
                  <Icon icon={license.type === 'addon' ? 'extension' : 'star'} />
                  {license.type}
                </span>
                <span className="license-exp">Expires: {formatDate(license.exp)}</span>
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
      ))}
    </Dialog>
  )
}

export default LicensesDialog

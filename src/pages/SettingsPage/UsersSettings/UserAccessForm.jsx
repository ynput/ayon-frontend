import { useSelector } from 'react-redux'
import { InputSwitch, FormLayout, FormRow, Icon } from '@ynput/ayon-react-components'
import { SelectButton } from 'primereact/selectbutton'
import AccessGroupsDropdown from '@containers/AccessGroupsDropdown'
import styled from 'styled-components'

const FormRowStyled = styled(FormRow)`
  .label {
    min-width: 160px;
  }
`

const NoteStyled = styled.span`
  margin: var(--padding-m) 0;
  padding: var(--padding-m);
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-secondary-container);

  gap: var(--base-gap-small);
  display: flex;
  align-items: center;
`

const UserAccessForm = ({ accessGroupsData, formData, onChange, disabled }) => {
  const authenticatedUser = useSelector((state) => state.user.data)

  const userLevels = [
    { label: 'User', value: 'user' },
    { label: 'Manager', value: 'manager' },
  ]

  // only admins can
  if (authenticatedUser.isAdmin) {
    userLevels.push({ label: 'Admin', value: 'admin' })
  }

  const updateFormData = (key, value) => {
    onChange && onChange(key, value)
  }

  const isUser = formData?.userLevel === 'user'
  const isManager = formData?.userLevel === 'manager'
  const isAdmin = formData?.userLevel === 'admin'

  const defaultAccessGroups = formData?.defaultAccessGroups || []

  const handleDefaultAccessGroupsChange = (value) => {
    updateFormData('defaultAccessGroups', value)
  }

  const isDeveloperSwitchDisabled = () =>
    isUser || isManager || !authenticatedUser.isAdmin || !formData?.userActive

  const getTooltip = () => {
    if (isUser) {
      return 'Users cannot be developers'
    }
    if (isManager) {
      return 'Managers cannot be developers'
    }
    if (authenticatedUser.isManager) {
      return 'Only admins can set developers'
    }

    return 'Developers have access to enhanced tools and features'
  }

  return (
    <>
      <b>Access</b>

      <FormLayout>

        <FormRowStyled label="Disable password">
          <InputSwitch
            checked={!!formData?.disablePasswordLogin}
            onChange={(e) => updateFormData('disablePasswordLogin', !!e.target.checked)}
          />
        </FormRowStyled>

        {formData?.isGuest && (
          <FormRowStyled label="Legacy guest mode">
            <div
              data-tooltip={isAdmin ? 'Admins cannot be guests' : "This user uses a legacy guest mode. Please assign them a user level and remove this flag."}
              data-tooltip-delay={0}
              style={{ width: 'fit-content' }}
            >
              <InputSwitch
                checked={disabled || isAdmin ? false : formData?.isGuest}
                onChange={(e) => updateFormData('isGuest', e.target.checked)}
                disabled={disabled || isAdmin}
                style={{
                  opacity: disabled ? 0.5 : 1,
                }}
              />
            </div>
          </FormRowStyled>
        )}

        <FormRowStyled label="Developer">
          <div data-tooltip={getTooltip()} data-tooltip-delay={0} style={{ width: 'fit-content' }}>
            <InputSwitch
              checked={formData?.isDeveloper}
              onChange={(e) => updateFormData('isDeveloper', e.target.checked)}
              disabled={isDeveloperSwitchDisabled()}
              style={{
                opacity: disabled ? 0.5 : 1,
              }}
            />
          </div>
        </FormRowStyled>

        <FormRowStyled label="Access level">
          <SelectButton
            unselectable={false}
            value={formData?.userLevel}
            onChange={(e) => updateFormData('userLevel', e.value)}
            options={userLevels}
            disabled={disabled}
          />
        </FormRowStyled>

        {isUser ? (
          <FormRowStyled
            label={'Default projects access'}
            data-tooltip={
              'When a new project is created, the user will automatically be added to the selected access groups. To grant a user the ability to manage project access for others, ensure an access group with those permissions is included here.'
            }
          >
            <AccessGroupsDropdown
              style={{ flexGrow: 1 }}
              selectedAccessGroups={defaultAccessGroups}
              setSelectedAccessGroups={handleDefaultAccessGroupsChange}
              placeholder={'Add access groups...'}
              isMultiple={formData._mixedFields?.includes('defaultAccessGroups')}
              accessGroups={accessGroupsData}
            />
          </FormRowStyled>
        ) : (
          <NoteStyled>
            <Icon icon="info" />
            Admins, managers and services have full access to all projects.
          </NoteStyled>
        )}
      </FormLayout>
    </>
  )
}

export default UserAccessForm

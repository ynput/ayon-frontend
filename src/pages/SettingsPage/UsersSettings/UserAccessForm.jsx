import { useSelector } from 'react-redux'
import { InputSwitch, FormLayout, FormRow, Panel } from '@ynput/ayon-react-components'
import { SelectButton } from 'primereact/selectbutton'
import AccessGroupsDropdown from '/src/containers/AccessGroupsDropdown'
import UserAccessGroups from './UserAccessGroupsForm/UserAccessGroupsForm'
import { useGetAllProjectsQuery } from '/src/services/project/getProject'

const UserAccessForm = ({ accessGroupsData, formData, onChange, disabled }) => {
  const isAdmin = useSelector((state) => state.user.data.isAdmin)
  const { data: projectsList = [] } = useGetAllProjectsQuery({ showInactive: false })

  const userLevels = [
    { label: 'User', value: 'user' },
    { label: 'Manager', value: 'manager' },
  ]

  // only admins can
  if (isAdmin) {
    userLevels.push({ label: 'Admin', value: 'admin' })
    userLevels.push({ label: 'Service', value: 'service' })
  }

  const activeOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ]

  const updateFormData = (key, value) => {
    onChange && onChange(key, value)
  }

  const isUser = formData?.userLevel === 'user'
  const isManager = formData?.userLevel === 'manager'

  const defaultAccessGroups = formData?.defaultAccessGroups
  const accessGroups = formData?.accessGroups

  const handleAccessGroupsChange = (value) => {
    updateFormData('defaultAccessGroups', value)
  }

  return (
    <>
      <Panel id="user-access-form">
        <b>Access Control</b>
        <FormLayout>
          <FormRow label="User active">
            <SelectButton
              unselectable={false}
              value={formData?.userActive}
              onChange={(e) => updateFormData('userActive', e.value)}
              options={activeOptions}
            />
          </FormRow>

          <FormRow label="Access level">
            <SelectButton
              unselectable={false}
              value={formData?.userLevel}
              onChange={(e) => updateFormData('userLevel', e.value)}
              options={userLevels}
              disabled={disabled}
            />
          </FormRow>

          {(isUser || isManager) && (
            <FormRow label="Guest">
              <InputSwitch
                checked={formData?.isGuest}
                onChange={(e) => updateFormData('isGuest', e.target.checked)}
                disabled={disabled}
                style={{
                  opacity: disabled ? 0.5 : 1,
                }}
              />
            </FormRow>
          )}

          <FormRow label="Developer">
            <InputSwitch
              checked={formData?.isDeveloper}
              onChange={(e) => updateFormData('isDeveloper', e.target.checked)}
            />
          </FormRow>

          {isUser && (
            <FormRow
              label={'Default Access'}
              data-tooltip={'The default access groups added to a new project for this user.'}
            >
              <AccessGroupsDropdown
                style={{ flexGrow: 1 }}
                selectedAccessGroups={defaultAccessGroups}
                setSelectedAccessGroups={handleAccessGroupsChange}
                placeholder={'Set access groups...'}
                isMultiple={formData._mixedFields?.includes('defaultAccessGroups')}
                accessGroups={accessGroupsData}
              />
            </FormRow>
          )}
        </FormLayout>
      </Panel>
      {isUser && (
        <UserAccessGroups
          value={accessGroups}
          options={accessGroupsData}
          projectsList={projectsList}
          onChange={(value) => updateFormData('accessGroups', value)}
        />
      )}
    </>
  )
}

export default UserAccessForm

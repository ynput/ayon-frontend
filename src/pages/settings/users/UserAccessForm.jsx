import { InputSwitch, FormLayout, FormRow } from '@ynput/ayon-react-components'
import { SelectButton } from 'primereact/selectbutton'
import RolesDropdown from '/src/containers/rolesDropdown'

const UserAccessForm = ({
  formData,
  setFormData,
  selectedProjects,
  hideProjectRoles,
  disabled,
}) => {
  const userLevels = [
    { label: 'User', value: 'user' },
    { label: 'Manager', value: 'manager' },
    { label: 'Service', value: 'service' },
  ]

  // only admins can
  // if (isAdmin) userLevels.push({ label: 'Admin', value: 'admin' })

  const activeOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ]

  const updateFormData = (key, value) => {
    setFormData((fd) => {
      return { ...fd, [key]: value }
    })
  }

  const userLevel = formData.userLevel === 'user'

  return (
    <>
      <b>Access Control</b>
      <FormLayout>
        <FormRow label="User active">
          <SelectButton
            unselectable={false}
            value={formData.userActive}
            onChange={(e) => updateFormData('userActive', e.value)}
            options={activeOptions}
            disabled={disabled}
          />
        </FormRow>

        <FormRow label="User level">
          <SelectButton
            unselectable={false}
            value={formData.userLevel}
            onChange={(e) => updateFormData('userLevel', e.value)}
            options={userLevels}
            disabled={disabled}
          />
        </FormRow>

        <FormRow label="Guest">
          <InputSwitch
            checked={formData.isGuest}
            onChange={(e) => updateFormData('isGuest', e.target.checked)}
            disabled={disabled}
            style={{
              opacity: disabled ? 0.5 : 1,
            }}
          />
        </FormRow>

        <>
          <FormRow label={'Default Roles'}>
            <RolesDropdown
              style={{ flexGrow: 1 }}
              selectedRoles={formData.defaultRoles}
              setSelectedRoles={(value) => updateFormData('defaultRoles', value)}
              disabled={selectedProjects || !userLevel || disabled}
              placeholder={!userLevel && 'all roles'}
            />
          </FormRow>
          {!hideProjectRoles && (
            <FormRow label={'Project Roles'}>
              <RolesDropdown
                style={{ flexGrow: 1 }}
                selectedRoles={selectedProjects ? formData.roles : []}
                setSelectedRoles={(value) => updateFormData('roles', value)}
                disabled={!selectedProjects || !userLevel || disabled}
                placeholder={
                  !userLevel
                    ? 'all roles'
                    : !selectedProjects
                    ? 'select a project'
                    : 'select roles...'
                }
              />
            </FormRow>
          )}
        </>
      </FormLayout>
    </>
  )
}

export default UserAccessForm

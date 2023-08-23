import { useSelector } from 'react-redux'
import { InputSwitch, FormLayout, FormRow } from '@ynput/ayon-react-components'
import { SelectButton } from 'primereact/selectbutton'
import RolesDropdown from '/src/containers/rolesDropdown'
import { isEqual } from 'lodash'

const UserAccessForm = ({ formData, setFormData, selectedProjects = [], disabled, isNew }) => {
  const isAdmin = useSelector((state) => state.user.data.isAdmin)

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
    setFormData((fd) => {
      return { ...fd, [key]: value }
    })
  }

  const userLevel = formData?.userLevel === 'user'
  const managerLevel = formData?.userLevel === 'manager'

  const isDefaultRoles = !selectedProjects?.length || isNew
  const defaultRoles = formData?.defaultRoles

  // check to see if the roles of each project are the same
  const allRolesTheSame = selectedProjects?.every((projectName) => {
    return isEqual(formData?.roles[projectName], formData?.roles[selectedProjects[0]])
  })

  const projectRoles = allRolesTheSame
    ? (formData?.roles && formData?.roles[selectedProjects[0]]) || []
    : []

  const handleRolesChange = (value) => {
    if (!isDefaultRoles) {
      // create new object with the new roles for selected projects
      const newRoles = selectedProjects.reduce((acc, projectName) => {
        acc[projectName] = value
        return acc
      }, {})

      updateFormData('roles', { ...formData?.roles, ...newRoles })
    } else {
      updateFormData('defaultRoles', value)
    }
  }

  return (
    <>
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

        {(userLevel || managerLevel) && (
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

        {userLevel && (
          <>
            <FormRow label={'Access Groups'}>
              <RolesDropdown
                style={{ flexGrow: 1 }}
                selectedRoles={!isDefaultRoles ? projectRoles : defaultRoles}
                setSelectedRoles={handleRolesChange}
                placeholder={
                  !allRolesTheSame && !isDefaultRoles ? 'Mixed Roles' : 'Select access groups...'
                }
                // onClearNoValue={!allRolesTheSame}
              />
            </FormRow>
          </>
        )}
      </FormLayout>
    </>
  )
}

export default UserAccessForm

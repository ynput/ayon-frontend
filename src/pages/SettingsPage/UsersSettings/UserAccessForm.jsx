import { useSelector } from 'react-redux'
import { InputSwitch, FormLayout, FormRow } from '@ynput/ayon-react-components'
import { SelectButton } from 'primereact/selectbutton'
import AccessGroupsDropdown from '/src/containers/AccessGroupsDropdown'
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

  const isDefaultAccessGroups = !selectedProjects?.length || isNew
  const defaultAccessGroups = formData?.defaultAccessGroups

  // check to see if the access groups of each project are the same
  const allAccessGroupsTheSame = selectedProjects?.every((projectName) => {
    return isEqual(formData?.accessGroups[projectName], formData?.accessGroups[selectedProjects[0]])
  })

  const projectAccessGroups = allAccessGroupsTheSame
    ? (formData?.accessGroups && formData?.accessGroups[selectedProjects[0]]) || []
    : []

  const handleAccessGroupsChange = (value) => {
    if (!isDefaultAccessGroups) {
      // create new object with the new access groups for selected projects
      const newAccessGroups = selectedProjects.reduce((acc, projectName) => {
        acc[projectName] = value
        return acc
      }, {})

      updateFormData('accessGroups', { ...formData?.accessGroups, ...newAccessGroups })
    } else {
      updateFormData('defaultAccessGroups', value)
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

        <FormRow label="Developer">
          <InputSwitch
            checked={formData?.isDeveloper}
            onChange={(e) => updateFormData('isDeveloper', e.target.checked)}
          />
        </FormRow>

        {userLevel && (
          <>
            <FormRow label={'Access Groups'}>
              <AccessGroupsDropdown
                style={{ flexGrow: 1 }}
                selectedAccessGroups={
                  !isDefaultAccessGroups ? projectAccessGroups : defaultAccessGroups
                }
                setSelectedAccessGroups={handleAccessGroupsChange}
                placeholder={
                  !allAccessGroupsTheSame && !isDefaultAccessGroups
                    ? 'Mixed access groups'
                    : 'Select access groups...'
                }
              />
            </FormRow>
          </>
        )}
      </FormLayout>
    </>
  )
}

export default UserAccessForm

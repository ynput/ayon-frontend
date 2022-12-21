import { InputText, FormLayout, FormRow, InputPassword } from '@ynput/ayon-react-components'
import { SelectButton } from 'primereact/selectbutton'
import RolesDropdown from '/src/containers/rolesDropdown'

const UserAttrib = ({ formData, setFormData, attributes, showPassword, password, setPassword }) => {
  return (
    <FormLayout>
      {Object.keys(attributes).map((attrName) => (
        <FormRow label={attributes[attrName]} key={attrName}>
          <InputText
            value={formData[attrName] || ''}
            onChange={(e) => {
              const value = e.target.value
              setFormData((fd) => {
                return { ...fd, [attrName]: value }
              })
            }}
          />
        </FormRow>
      ))}
      {showPassword && (
        <FormRow label="Password">
          <InputPassword
            value={password}
            feedback={false}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormRow>
      )}
    </FormLayout>
  )
}

const AccessControl = ({ formData, setFormData, rolesLabel = 'Roles' }) => {
  const userLevels = [
    { label: 'User', value: 'user' },
    { label: 'Manager', value: 'manager' },
    { label: 'Admin', value: 'admin' },
    { label: 'Service', value: 'service' },
  ]

  const activeOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ]

  const updateFormData = (key, value) => {
    setFormData((fd) => {
      return { ...fd, [key]: value }
    })
  }

  return (
    <FormLayout>
      <FormRow label="User active">
        <SelectButton
          unselectable={false}
          value={formData.userActive}
          onChange={(e) => updateFormData('userActive', e.value)}
          options={activeOptions}
        />
      </FormRow>

      <FormRow label="User level">
        <SelectButton
          unselectable={false}
          value={formData.userLevel}
          onChange={(e) => updateFormData('userLevel', e.value)}
          options={userLevels}
        />
      </FormRow>

      {formData.userLevel === 'user' && (
        <FormRow label={rolesLabel}>
          <RolesDropdown
            style={{ flexGrow: 1 }}
            selectedRoles={formData.roles}
            setSelectedRoles={(value) => updateFormData('roles', value)}
          />
        </FormRow>
      )}
    </FormLayout>
  )
}

export { UserAttrib, AccessControl }

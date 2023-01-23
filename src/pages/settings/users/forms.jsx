import {
  InputSwitch,
  InputText,
  FormLayout,
  FormRow,
  InputPassword,
} from '@ynput/ayon-react-components'
import { SelectButton } from 'primereact/selectbutton'
import { DividerSmallStyled } from './userDetail'
import RolesDropdown from '/src/containers/rolesDropdown'

const UserAttrib = ({ formData, setFormData, attributes, password, setPassword }) => {
  // separate custom attrib
  const [builtin, custom] = attributes.reduce(
    (acc, cur) => {
      if (!cur.builtin && cur.builtin !== undefined) {
        // add to custo,
        acc[1].push(cur)
      } else {
        // builtin
        acc[0].push(cur)
      }

      return acc
    },
    [[], []],
  )

  const buildForms = (attribs) =>
    attribs.map(({ name, data }) => (
      <FormRow label={data.title} key={name}>
        {name === 'password' && setPassword ? (
          <InputPassword
            value={password}
            feedback={false}
            onChange={(e) => setPassword(e.target.value)}
          />
        ) : (
          <InputText
            value={formData[name] || ''}
            onChange={(e) => {
              const value = e.target.value
              setFormData((fd) => {
                return { ...fd, [name]: value }
              })
            }}
          />
        )}
      </FormRow>
    ))

  return (
    <>
      <FormLayout>
        {buildForms(builtin)}
        {!!custom.length && (
          <>
            <DividerSmallStyled />
            <b>Custom Attributes</b>
            {buildForms(custom)}
          </>
        )}
      </FormLayout>
    </>
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
    <>
      <DividerSmallStyled />
      <b>Access Control</b>
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

        <FormRow label="Guest">
          <InputSwitch
            checked={formData.isGuest}
            onChange={(e) => updateFormData('isGuest', e.target.checked)}
          />
        </FormRow>

        <FormRow label={rolesLabel}>
          <RolesDropdown
            style={{ flexGrow: 1 }}
            selectedRoles={formData.roles}
            setSelectedRoles={(value) => updateFormData('roles', value)}
            disabled={formData.userLevel !== 'user'}
            placeholder={formData.userLevel !== 'user' && 'all roles'}
          />
        </FormRow>
      </FormLayout>
    </>
  )
}

export { UserAttrib, AccessControl }

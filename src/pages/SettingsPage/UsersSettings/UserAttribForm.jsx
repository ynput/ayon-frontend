import {
  InputText,
  FormLayout,
  FormRow,
  InputPassword,
  Divider,
  Dropdown,
  InputSwitch,
} from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const DividerSmallStyled = styled(Divider)`
  margin: 8px 0;
`

const UserAttribForm = ({
  formData,
  setFormData,
  attributes,
  password,
  passwordConfirm,
  setPasswordConfirm,
  setPassword,
  disabled,
  showAvatarUrl = true,
  customFormRow,
}) => {
  // separate custom attrib
  const [builtin, custom] = attributes.reduce(
    (acc, cur) => {
      if (!cur.builtin && cur.builtin !== undefined) {
        // add to custom if not already present
        if (!acc[1].some((item) => item.name === cur.name)) {
          acc[1].push(cur)
        }
      } else {
        // add to builtin if not already present
        if (!acc[0].some((item) => item.name === cur.name)) {
          acc[0].push(cur)
        }
      }

      return acc
    },
    [[], []],
  )

  const CustomFormRow = customFormRow !== undefined ? customFormRow : FormRow;

  const buildForms = (attribs) =>
    attribs.map(({ name, data, input }) => {
      let widget = null

      if (name === 'avatarUrl' && !showAvatarUrl) return null
      if (name.includes('password') && setPassword) {
        widget = (
          <InputPassword
            value={name.includes('Confirm') ? passwordConfirm : password}
            feedback={false}
            onChange={(e) =>
              name.includes('Confirm')
                ? setPasswordConfirm(e.target.value)
                : setPassword(e.target.value)
            }
            disabled={disabled}
            autoComplete="new-password"
          />
        )
      } else if (data.enum) {
        widget = (
          <Dropdown
            widthExpand
            value={(data.type === 'list_of_strings' ? formData[name] : [formData[name]]) || []}
            options={data.enum}
            multiSelect={data.type === 'list_of_strings'}
            onChange={(v) =>
              setFormData((fd) => {
                const nv = data.type === 'list_of_strings' ? v : v[0]
                return { ...fd, [name]: nv }
              })
            }
          />
        )
      } else if (data.type === 'boolean') {
        if (name === 'developerMode') return null

        widget = (
          <InputSwitch
            checked={formData[name]}
            onChange={(e) => {
              setFormData((fd) => {
                return { ...fd, [name]: e.target.checked }
              })
            }}
            disabled={disabled}
            style={{
              opacity: disabled ? 0.5 : 1,
            }}
          />
        )
      } else {
        widget = (
          <InputText
            value={formData[name] || ''}
            disabled={disabled}
            onChange={(e) => {
              let value = e.target.value
              if (name === 'email') value = value.replace(/\s/g, '')
              setFormData((fd) => {
                return { ...fd, [name]: value }
              })
            }}
            autoComplete="cc-csc"
            {...input}
          />
        )
      }
      return (
        <CustomFormRow label={data.title} key={name}>
          {widget}
        </CustomFormRow>
      )
    })

  return (
    <>
      <FormLayout>
        {buildForms(builtin)}
        {!!custom.length && (
          <>
            <DividerSmallStyled />
            {buildForms(custom)}
          </>
        )}
      </FormLayout>
    </>
  )
}

export default UserAttribForm

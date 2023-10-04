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
}) => {
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
    attribs.map(({ name, data, input }) => {
      let inputComp = null

      if (name.includes('password') && setPassword) {
        inputComp = (
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
        inputComp = (
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
      } else if (data?.type === 'boolean') {
        inputComp = (
          <InputSwitch
            checked={formData[name]}
            disabled={disabled}
            onChange={(e) => setFormData((fd) => ({ ...fd, [name]: e.target.checked }))}
          />
        )
      } else {
        inputComp = (
          <InputText
            value={formData[name] || ''}
            disabled={disabled}
            onChange={(e) => {
              const value = e.target.value
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
        <FormRow label={data.title} key={name}>
          {inputComp}
        </FormRow>
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

import {
  InputText,
  FormLayout,
  FormRow,
  InputPassword,
  Divider,
  Dropdown,
  InputSwitch,
  Button,
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

  console.log(builtin,'builtin')
  console.log(formData,'formData')

  const buildForms = (attribs) =>
    attribs.map(({ name, data, input }) => {
      let widget = null

   

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
      } else if (name === 'avatarUrl') {
        widget = (
         <span style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row', gap: 8}}>
           <InputText style={{flex: 1}} value={formData[name] || ''} 
            disabled={disabled}
            onChange={(e) => {
              const value = e.target.value
              setFormData((fd) => {
                return { ...fd, [name]: value }
              })
            }}
            autoComplete="cc-csc"
            {...input}/>
           <Button icon="upload">Upload</Button>
         </span>
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
        console.log(formData,'formData')
        widget = (
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
          {widget}
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

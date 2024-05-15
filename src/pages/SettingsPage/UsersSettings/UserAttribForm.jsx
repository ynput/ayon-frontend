import { useRef } from 'react'
import {
  InputText,
  FormLayout,
  FormRow,
  InputPassword,
  Divider,
  Dropdown,
  InputSwitch,
  Button,
  UserImage
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
  onUpdateAvatar
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



  const handleInputChange = (e) => {
    e.preventDefault()
    if (!e.target.files || !e.target.files[0]) return
    const files = e.target.files[0]
    console.log(files, 'files')
    onUpdateAvatar(files)
  }

  const fileInput = useRef(null)

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
      // } else if (name === 'avatarUrl') {
      //   console.log(formData,'formData')
      //   const { avatarUrl, fullName } = formData
      //   widget = (
      //   <span style={{ display: 'flex', flexDirection: 'row', gap: 8}}>
      //     <UserImage src={avatarUrl} fullName={fullName} />
      //    <Button
      //     icon="upload"
      //     className="upload-button"
      //     iconProps={{ className: 'edit' }}
      //     data-tooltip={'Upload thumbnail from file'}
      //     tooltip="Upload Avatar"
      //     onClick={() => fileInput.current.click()}
      //   >
      //     Upload New Avatar
      //   </Button>
      //   <input type="file" ref={fileInput} style={{ display: 'none' }}  multiple={false} onChange={handleInputChange} accept=".png, .jpeg, .jpg" />
      //  </span>
      //   )
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

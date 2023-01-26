import {
  InputText,
  FormLayout,
  FormRow,
  InputPassword,
  Divider,
} from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const DividerSmallStyled = styled(Divider)`
  margin: 10px 0;
`

const UserAttribForm = ({ formData, setFormData, attributes, password, setPassword, disabled }) => {
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
            disabled={disabled}
          />
        ) : (
          <InputText
            value={formData[name] || ''}
            disabled={disabled}
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
            {buildForms(custom)}
          </>
        )}
      </FormLayout>
    </>
  )
}

export default UserAttribForm

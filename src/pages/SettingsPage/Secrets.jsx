import { useState, useEffect } from 'react'
import {
  useGetSecretsQuery,
  useSetSecretMutation,
  useDeleteSecretMutation,
} from '/src/services/secrets'
import styled from 'styled-components'
import { InputText, Button } from '@ynput/ayon-react-components'

const SecretList = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 30px;
  gap: 10px;
`

const StyledSecretItem = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  width: 600px;

  input:nth-child(2) {
    flex-grow: 1;
  }
`

const SecretItem = ({ name: initialName, value: initialValue, stored }) => {
  const [name, setName] = useState(initialName)
  const [value, setValue] = useState(initialValue)
  const [setSecret] = useSetSecretMutation()
  const [deleteSecret] = useDeleteSecretMutation()

  useEffect(() => {
    setName(initialName)
    setValue(initialValue)
  }, [initialName, initialValue])

  const handleSave = () => {
    setSecret({ name, value })
    if (!stored) {
      setName('')
      setValue('')
    }
  }

  const handleDelete = () => {
    deleteSecret({ name })
  }

  return (
    <StyledSecretItem>
      <InputText
        value={name}
        onChange={(e) => setName(e.target.value)}
        readOnly={stored}
        placeholder="Secret name"
      />
      <InputText
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Secret value"
      />
      <Button icon="check" onClick={handleSave} />
      <Button icon="delete" onClick={handleDelete} disabled={!stored} />
    </StyledSecretItem>
  )
}

const Secrets = () => {
  const { data } = useGetSecretsQuery()

  return (
    <SecretList>
      <h2>New secret</h2>
      <SecretItem name="" value="" stored={false} />
      <h2>Stored secrets</h2>
      {data?.length &&
        data.map((secret) => (
          <SecretItem key={secret.name} name={secret.name} value={secret.value} stored={true} />
        ))}
    </SecretList>
  )
}

export default Secrets

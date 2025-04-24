import { useState, useEffect } from 'react'
import { useGetSecretsQuery, useSetSecretMutation, useDeleteSecretMutation } from '@queries/secrets'
import styled from 'styled-components'
import {
  InputText,
  InputPassword,
  Button,
  ScrollPanel,
  Section,
  SaveButton,
} from '@ynput/ayon-react-components'
import { toast } from 'react-toastify'
import { confirmDelete } from '@shared/util'
import copyToClipboard from '@helpers/copyToClipboard'

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
  gap: var(--base-gap-large);
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

  // console.log(isError, isLoading)

  const resetForm = () => {
    setName('')
    setValue('')
  }

  useEffect(() => {
    setName(initialName)
    setValue(initialValue)
  }, [initialName, initialValue])

  const handleSave = async () => {
    try {
      await setSecret({ name, value }).unwrap()

      if (!stored) {
        resetForm()
      }
    } catch (error) {
      console.error(error)

      if (error.data?.detail) {
        toast.error(error.data.detail)
      }
    }
  }

  const handleDelete = async () => {
    confirmDelete({
      label: 'Secret',
      accept: async () => await deleteSecret({ name }).unwrap(),
    })
  }

  return (
    <StyledSecretItem>
      <InputText
        value={name}
        onChange={(e) => setName(e.target.value)}
        readOnly={stored}
        placeholder="Secret name"
        pattern="^\S+$"
      />

      <InputPassword
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Secret value"
      />

      {stored && <Button icon="content_copy" onClick={() => copyToClipboard(value)} />}

      <SaveButton
        active={stored || (name.length > 0 && value.length > 0)}
        icon={stored ? 'check' : 'add'}
        onClick={handleSave}
        variant={stored ? 'surface' : 'filled'}
        label={stored ? '' : 'Add'}
      />
      {stored && <Button icon="delete" onClick={handleDelete} />}
    </StyledSecretItem>
  )
}

const Secrets = () => {
  const { data } = useGetSecretsQuery()

  return (
    <Section>
      <ScrollPanel
        style={{
          height: '100%',
          backgroundColor: 'transparent',
        }}
      >
        <SecretList>
          <h2>New secret</h2>
          <SecretItem name="" value="" stored={false} />
          <h2>Stored secrets</h2>
          {data?.length &&
            data
              .filter((secret) => secret.name !== 'ynput_cloud_key')
              .map((secret) => (
                <SecretItem
                  key={secret.name}
                  name={secret.name}
                  value={secret.value}
                  stored={true}
                />
              ))}
        </SecretList>
      </ScrollPanel>
    </Section>
  )
}

export default Secrets

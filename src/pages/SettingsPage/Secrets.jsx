import { useState, useEffect } from 'react'
import { useGetSecretsQuery, useSetSecretMutation, useDeleteSecretMutation } from '@queries/secrets'
import styled from 'styled-components'
import {
  InputText,
  InputPassword,
  Button,
  Toolbar,
  theme,
  SaveButton,
} from '@ynput/ayon-react-components'
import { toast } from 'react-toastify'
import { confirmDelete, getRequestErrorString } from '@shared/util'
import { copyToClipboard } from '@shared/util'
import {
  SettingsFormSection,
  SettingsFormTitle,
  SettingsFormScrollPanel,
  SettingsFormContent,
} from './SettingsFormPage.styled'

const SecretGroup = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);

  & + & {
    padding-top: var(--padding-m);
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }

  h3 {
    ${theme.labelLarge}
    margin: 0;
  }
`

const StyledSecretItem = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(160px, 2fr) 112px;
  align-items: center;
  gap: var(--base-gap-large);

  > * {
    min-width: 0;
    width: 100%;
  }

  input {
    width: 100%;
  }

  .secret-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--base-gap-large);
  }

  @media (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr) 112px;

    > input {
      grid-column: 1 / -1;
    }
  }
`

const SecretItem = ({ name: initialName, value: initialValue, stored }) => {
  const [name, setName] = useState(initialName)
  const [value, setValue] = useState(initialValue)
  const [setSecret, { isLoading: isSaving }] = useSetSecretMutation()
  const [deleteSecret] = useDeleteSecretMutation()

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
      const message = getRequestErrorString(error)
      if (message) toast.error(message)
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

      <div className="secret-actions">
        {stored && (
          <Button
            icon="content_copy"
            aria-label="Copy secret value"
            data-tooltip="Copy secret value"
            onClick={() => copyToClipboard(value)}
          />
        )}
        <SaveButton
          active={stored ? value !== initialValue : name.length > 0 && value.length > 0}
          saving={isSaving}
          icon={stored ? 'check' : 'add'}
          onClick={handleSave}
          variant={stored ? 'surface' : 'filled'}
          label={stored ? '' : 'Add'}
          aria-label={stored ? 'Save secret' : 'Add secret'}
          data-tooltip={stored ? 'Save secret' : undefined}
        />
        {stored && (
          <Button
            icon="delete"
            aria-label="Delete secret"
            data-tooltip="Delete secret"
            onClick={handleDelete}
          />
        )}
      </div>
    </StyledSecretItem>
  )
}

const Secrets = () => {
  const { data } = useGetSecretsQuery()

  const secrets = data?.filter((secret) => secret.name !== 'ynput_cloud_key')

  return (
    <main>
      <SettingsFormSection direction="column">
        <Toolbar>
          <SettingsFormTitle>Secrets</SettingsFormTitle>
        </Toolbar>
        <SettingsFormScrollPanel className="transparent">
          <SettingsFormContent>
            <SecretGroup>
              <h3>New secret</h3>
              <SecretItem name="" value="" stored={false} />
            </SecretGroup>
            <SecretGroup>
              <h3>Stored secrets</h3>
              {secrets?.map((secret) => (
                <SecretItem
                  key={secret.name}
                  name={secret.name}
                  value={secret.value}
                  stored={true}
                />
              ))}
              {secrets?.length === 0 && <span>No stored secrets</span>}
            </SecretGroup>
          </SettingsFormContent>
        </SettingsFormScrollPanel>
      </SettingsFormSection>
    </main>
  )
}

export default Secrets

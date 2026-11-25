import { useState, useEffect, useRef } from 'react'
import { useGetSecretsQuery, useSetSecretMutation, useDeleteSecretMutation } from '@queries/secrets'
import styled from 'styled-components'
import {
  InputText,
  InputPassword,
  FormRow,
  Button,
  Toolbar,
  theme,
  SaveButton,
} from '@ynput/ayon-react-components'
import { toast } from 'react-toastify'
import {
  confirmDelete,
  getRequestErrorString,
  isDialogConfirmKey,
  isDialogContinueKey,
} from '@shared/util'
import { copyToClipboard } from '@shared/util'
import { useFlatSettingsLayout } from '@hooks/useFlatSettingsLayout'
import { FlatFormCard } from '@components/FlatFormCard'
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

// a secret's rows in the flat layout: its value and actions share the row's field
const FlatSecretRows = styled.div`
  display: flex;
  flex-direction: column;

  .secret-value {
    display: flex;
    align-items: center;
    gap: var(--base-gap-large);

    > :first-child {
      flex: 1;
      min-width: 0;
    }

    /* the dots stop before the show button */
    input {
      padding-right: 36px;
    }
  }

  .secret-actions {
    display: flex;
    gap: var(--base-gap-large);
  }
`

const SecretItem = ({ name: initialName, value: initialValue, stored, flat }) => {
  const [name, setName] = useState(initialName)
  const [value, setValue] = useState(initialValue)
  const [setSecret, { isLoading: isSaving }] = useSetSecretMutation()
  const [deleteSecret] = useDeleteSecretMutation()
  const nameRef = useRef(null)

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
        // ready for the next secret
        toast.success(`Secret ${name} added`)
        resetForm()
        nameRef.current?.focus()
      } else {
        toast.success(`Secret ${name} saved`)
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

  // a stored secret saves only once its value changed
  const canSave = stored ? value !== initialValue : name.length > 0 && value.length > 0

  // Enter (or Shift+Enter, as in the create dialogs) saves the row, like its save button
  const handleKeyDown = (e) => {
    if (!canSave || !(isDialogConfirmKey(e) || isDialogContinueKey(e))) return
    e.preventDefault()
    handleSave()
  }

  const nameInput = (
    <InputText
      ref={nameRef}
      value={name}
      onChange={(e) => setName(e.target.value)}
      readOnly={stored}
      placeholder="Secret name"
      pattern="^\S+$"
    />
  )

  const valueInput = (
    <InputPassword
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Secret value"
    />
  )

  const actions = (
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
        active={canSave}
        data-shortcut="Enter"
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
  )

  // flat settings layout: rows of a panel. A stored secret is named by its row's label
  if (flat)
    return (
      <FlatSecretRows onKeyDown={handleKeyDown}>
        {!stored && <FormRow label="Name">{nameInput}</FormRow>}
        <FormRow label={stored ? name : 'Value'}>
          <div className="secret-value">
            {valueInput}
            {actions}
          </div>
        </FormRow>
      </FlatSecretRows>
    )

  return (
    <StyledSecretItem onKeyDown={handleKeyDown}>
      {nameInput}
      {valueInput}
      {actions}
    </StyledSecretItem>
  )
}

const Secrets = () => {
  const { data } = useGetSecretsQuery()

  const secrets = data?.filter((secret) => secret.name !== 'ynput_cloud_key')
  const flatLayout = useFlatSettingsLayout()

  return (
    <main>
      <SettingsFormSection direction="column">
        <Toolbar>
          <SettingsFormTitle>Secrets</SettingsFormTitle>
        </Toolbar>
        <SettingsFormScrollPanel className="transparent">
          <SettingsFormContent>
            {flatLayout ? (
              <div className="flat-form">
                <FlatFormCard title="New secret">
                  <div>
                    <SecretItem name="" value="" stored={false} flat />
                  </div>
                </FlatFormCard>
                <FlatFormCard title="Stored secrets">
                  <div>
                    {secrets?.map((secret) => (
                      <SecretItem
                        key={secret.name}
                        name={secret.name}
                        value={secret.value}
                        stored
                        flat
                      />
                    ))}
                    {secrets?.length === 0 && <span>No stored secrets</span>}
                  </div>
                </FlatFormCard>
              </div>
            ) : (
              <>
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
              </>
            )}
          </SettingsFormContent>
        </SettingsFormScrollPanel>
      </SettingsFormSection>
    </main>
  )
}

export default Secrets

import { FC, useState, useCallback } from 'react'
import {
  Dialog,
  Button,
  InputText,
  Dropdown,
  SaveButton,
  Spacer,
} from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { CreateOAuthClientRequest } from '../../../services/oauthClients'

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
`

const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
`

const Label = styled.label`
  font-size: 14px;
  color: var(--md-sys-color-on-surface);
  user-select: none;
`

const ArrayInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
`

const ArrayInputRow = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
`

const ErrorMessage = styled.div`
  color: var(--md-sys-color-error);
  font-size: 12px;
`

const InfoMessage = styled.div`
  color: var(--md-sys-color-outline);
  font-size: 12px;
  margin-top: -8px;
`

interface NewOAuthClientDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateOAuthClientRequest) => Promise<void>
  isLoading?: boolean
  error?: string
}

const CLIENT_TYPE_OPTIONS = [
  { value: 'confidential', label: 'Confidential' },
  { value: 'public', label: 'Public' },
]

const GRANT_TYPE_OPTIONS = [
  { value: 'authorization_code', label: 'Authorization Code' },
  { value: 'client_credentials', label: 'Client Credentials' },
  { value: 'refresh_token', label: 'Refresh Token' },
  { value: 'password', label: 'Password' },
]

const RESPONSE_TYPE_OPTIONS = [
  { value: 'code', label: 'Code' },
  { value: 'token', label: 'Token' },
]

export const NewOAuthClientDialog: FC<NewOAuthClientDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  error,
}) => {
  const [formData, setFormData] = useState<CreateOAuthClientRequest>({
    clientName: '',
    redirectUris: [''],
    grantTypes: ['authorization_code'],
    responseTypes: ['code'],
    scope: 'read',
    clientType: 'confidential',
  })

  const handleFieldChange = useCallback(
    <K extends keyof CreateOAuthClientRequest>(field: K, value: CreateOAuthClientRequest[K]) => {
      setFormData((prev: CreateOAuthClientRequest) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const handleRedirectUriChange = (index: number, value: string) => {
    const newUris = [...formData.redirectUris]
    newUris[index] = value
    handleFieldChange('redirectUris', newUris)
  }

  const handleAddRedirectUri = () => {
    handleFieldChange('redirectUris', [...formData.redirectUris, ''])
  }

  const handleRemoveRedirectUri = (index: number) => {
    if (formData.redirectUris.length > 1) {
      const newUris = formData.redirectUris.filter((_: string, i: number) => i !== index)
      handleFieldChange('redirectUris', newUris)
    }
  }

  const handleSubmit = async () => {
    // Filter out empty redirect URIs
    const filteredData = {
      ...formData,
      redirectUris: formData.redirectUris.filter((uri: string) => uri.trim() !== ''),
    }
    
    if (filteredData.redirectUris.length === 0) {
      return
    }

    await onSubmit(filteredData)
  }

  const handleClose = () => {
    // Reset form
    setFormData({
      clientName: '',
      redirectUris: [''],
      grantTypes: ['authorization_code'],
      responseTypes: ['code'],
      scope: 'read',
      clientType: 'confidential',
    })
    onClose()
  }

  const isValid =
    formData.clientName.trim() !== '' &&
    formData.redirectUris.some((uri: string) => uri.trim() !== '') &&
    formData.grantTypes.length > 0 &&
    formData.responseTypes.length > 0

  return (
    <Dialog
      header="Create New OAuth Client"
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      style={{ maxWidth: 600 }}
      footer={
        <>
          <Button variant="text" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Spacer />
          <SaveButton onClick={handleSubmit} disabled={!isValid || isLoading} saving={isLoading}>
            Create Client
          </SaveButton>
        </>
      }
    >
      <FormContainer>
        <FormRow>
          <Label>Client Name *</Label>
          <InputText
            value={formData.clientName}
            onChange={(e) => handleFieldChange('clientName', e.target.value)}
            placeholder="Enter client name"
            autoFocus
          />
        </FormRow>

        <FormRow>
          <Label>Redirect URIs *</Label>
          <ArrayInputContainer>
            {formData.redirectUris.map((uri: string, index: number) => (
              <ArrayInputRow key={index}>
                <InputText
                  value={uri}
                  onChange={(e) => handleRedirectUriChange(index, e.target.value)}
                  placeholder="https://example.com/callback"
                  style={{ flex: 1 }}
                />
                {formData.redirectUris.length > 1 && (
                  <Button
                    icon="close"
                    variant="text"
                    onClick={() => handleRemoveRedirectUri(index)}
                  />
                )}
              </ArrayInputRow>
            ))}
            <Button
              icon="add"
              label="Add Redirect URI"
              variant="text"
              onClick={handleAddRedirectUri}
            />
          </ArrayInputContainer>
        </FormRow>

        <FormRow>
          <Label>Client Type</Label>
          <Dropdown
            value={[formData.clientType]}
            options={CLIENT_TYPE_OPTIONS}
            onChange={(values) => handleFieldChange('clientType', values[0] as any)}
            widthExpand
            dataKey="value"
            labelKey="label"
          />
          <InfoMessage>
            Confidential clients can keep secrets secure, while public clients cannot.
          </InfoMessage>
        </FormRow>

        <FormRow>
          <Label>Grant Types</Label>
          <Dropdown
            value={formData.grantTypes}
            options={GRANT_TYPE_OPTIONS}
            onChange={(values) => handleFieldChange('grantTypes', values)}
            widthExpand
            dataKey="value"
            labelKey="label"
          />
        </FormRow>

        <FormRow>
          <Label>Response Types</Label>
          <Dropdown
            value={formData.responseTypes}
            options={RESPONSE_TYPE_OPTIONS}
            onChange={(values) => handleFieldChange('responseTypes', values)}
            widthExpand
            dataKey="value"
            labelKey="label"
          />
        </FormRow>

        <FormRow>
          <Label>Scope</Label>
          <InputText
            value={formData.scope}
            onChange={(e) => handleFieldChange('scope', e.target.value)}
            placeholder="read write"
          />
          <InfoMessage>Space-separated list of scopes (e.g., "read write")</InfoMessage>
        </FormRow>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </FormContainer>
    </Dialog>
  )
}

export default NewOAuthClientDialog

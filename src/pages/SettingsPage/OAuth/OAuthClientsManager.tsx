import { FC, useState } from 'react'
import { Section, Button, Toolbar } from '@ynput/ayon-react-components'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import styled from 'styled-components'
import { useGetOAuthClientsQuery, useCreateOAuthClientMutation, useDeleteOAuthClientMutation } from '../../../services/oauthClients'
import type { OAuthClient, CreateOAuthClientRequest } from '../../../services/oauthClients'
import NewOAuthClientDialog from './NewOAuthClientDialog'
import { toast } from 'react-toastify'
import { Dialog } from '@ynput/ayon-react-components'
import { confirmDialog } from 'primereact/confirmdialog'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  height: 100%;
  padding: var(--padding-m);
`

const TableContainer = styled.div`
  flex: 1;
  overflow: auto;
  
  .p-datatable {
    .p-datatable-wrapper {
      border-radius: var(--border-radius-m);
    }
    
    .p-datatable-thead > tr > th {
      background-color: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      padding: 12px;
      font-weight: 500;
    }
    
    .p-datatable-tbody > tr {
      background-color: var(--md-sys-color-surface-container-low);
      color: var(--md-sys-color-on-surface);
      
      &:hover {
        background-color: var(--md-sys-color-surface-container);
      }
      
      > td {
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        padding: 12px;
      }
    }
  }
`

const ArrayCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Badge = styled.span`
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  padding: 2px 8px;
  border-radius: var(--border-radius-m);
  font-size: 12px;
  width: fit-content;
`

const SecretContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
`

const SecretValue = styled.code`
  background-color: var(--md-sys-color-surface-container-highest);
  padding: 4px 8px;
  border-radius: var(--border-radius-m);
  font-size: 12px;
  font-family: monospace;
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: var(--base-gap-large);
  color: var(--md-sys-color-outline);
  
  .icon {
    font-size: 48px;
  }
  
  h3 {
    margin: 0;
    color: var(--md-sys-color-on-surface);
  }
`

interface ClientSecretDialogProps {
  isOpen: boolean
  onClose: () => void
  clientId?: string
  clientSecret?: string
}

const ClientSecretDialog: FC<ClientSecretDialogProps> = ({
  isOpen,
  onClose,
  clientId,
  clientSecret,
}) => {
  const handleCopy = () => {
    if (clientSecret) {
      navigator.clipboard.writeText(clientSecret)
      toast.success('Client secret copied to clipboard')
    }
  }

  return (
    <Dialog
      header="OAuth Client Created"
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      footer={
        <Button variant="filled" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p>
          Your OAuth client has been created successfully. Please save the client secret below as
          it will not be shown again.
        </p>
        <div>
          <strong>Client ID:</strong>
          <SecretContainer>
            <SecretValue>{clientId}</SecretValue>
          </SecretContainer>
        </div>
        <div>
          <strong>Client Secret:</strong>
          <SecretContainer>
            <SecretValue>{clientSecret}</SecretValue>
            <Button icon="content_copy" onClick={handleCopy} variant="text" />
          </SecretContainer>
        </div>
      </div>
    </Dialog>
  )
}

export const OAuthClientsManager: FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [createdClient, setCreatedClient] = useState<{
    clientId: string
    clientSecret: string
  } | null>(null)

  const { data: clients = [], isLoading, error } = useGetOAuthClientsQuery()
  const [createClient, { isLoading: isCreating }] = useCreateOAuthClientMutation()
  const [deleteClient] = useDeleteOAuthClientMutation()

  const handleCreateClient = async (data: CreateOAuthClientRequest) => {
    try {
      const result = await createClient(data).unwrap()
      toast.success('OAuth client created successfully')
      setIsDialogOpen(false)
      
      // Show the client secret dialog
      if (result.clientSecret) {
        setCreatedClient({
          clientId: result.clientId,
          clientSecret: result.clientSecret,
        })
      }
    } catch (err: any) {
      console.error('Failed to create OAuth client:', err)
      toast.error(err?.data?.detail || 'Failed to create OAuth client')
    }
  }

  const handleDeleteClient = (clientId: string, clientName: string) => {
    confirmDialog({
      message: `Are you sure you want to delete the OAuth client "${clientName}"? This action cannot be undone.`,
      header: 'Delete OAuth Client',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await deleteClient(clientId).unwrap()
          toast.success('OAuth client deleted successfully')
        } catch (err: any) {
          console.error('Failed to delete OAuth client:', err)
          toast.error(err?.data?.detail || 'Failed to delete OAuth client')
        }
      },
    })
  }

  const arrayTemplate = (items: string[]) => {
    if (!items || items.length === 0) return '-'
    return (
      <ArrayCell>
        {items.map((item, index) => (
          <Badge key={index}>{item}</Badge>
        ))}
      </ArrayCell>
    )
  }

  const dateTemplate = (date?: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleString()
  }

  if (isLoading) {
    return (
      <Container>
        <Section>Loading...</Section>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Section>
          <div style={{ color: 'var(--md-sys-color-error)' }}>
            Error loading OAuth clients. Please try again.
          </div>
        </Section>
      </Container>
    )
  }

  return (
    <Container>
      <Section>
        <Toolbar>
          <h2 style={{ margin: 0 }}>OAuth Clients</h2>
          <Button
            icon="add"
            label="Create Client"
            onClick={() => setIsDialogOpen(true)}
            variant="filled"
          />
        </Toolbar>
      </Section>

      {clients.length === 0 ? (
        <Section>
          <EmptyState>
            <span className="icon material-symbols-outlined">security</span>
            <h3>No OAuth Clients</h3>
            <p>Create your first OAuth client to get started.</p>
            <Button
              icon="add"
              label="Create OAuth Client"
              onClick={() => setIsDialogOpen(true)}
              variant="filled"
            />
          </EmptyState>
        </Section>
      ) : (
        <TableContainer>
          <DataTable
            value={clients}
            stripedRows
            showGridlines
            emptyMessage="No clients found"
          >
            <Column field="clientId" header="Client ID" style={{ width: '200px' }} />
            <Column field="clientName" header="Name" />
            <Column
              field="clientType"
              header="Type"
              body={(row: OAuthClient) => (
                <Badge>{row.clientType}</Badge>
              )}
              style={{ width: '120px' }}
            />
            <Column
              field="redirectUris"
              header="Redirect URIs"
              body={(row: OAuthClient) => arrayTemplate(row.redirectUris)}
            />
            <Column
              field="grantTypes"
              header="Grant Types"
              body={(row: OAuthClient) => arrayTemplate(row.grantTypes)}
              style={{ width: '200px' }}
            />
            <Column
              field="responseTypes"
              header="Response Types"
              body={(row: OAuthClient) => arrayTemplate(row.responseTypes)}
              style={{ width: '180px' }}
            />
            <Column field="scope" header="Scope" style={{ width: '120px' }} />
            <Column
              field="createdAt"
              header="Created"
              body={(row: OAuthClient) => dateTemplate(row.createdAt)}
              style={{ width: '180px' }}
            />
            <Column
              header="Actions"
              body={(row: OAuthClient) => (
                <Button
                  icon="delete"
                  variant="text"
                  onClick={() => handleDeleteClient(row.clientId, row.clientName)}
                  style={{ color: 'var(--md-sys-color-error)' }}
                />
              )}
              style={{ width: '80px' }}
            />
          </DataTable>
        </TableContainer>
      )}

      <NewOAuthClientDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreateClient}
        isLoading={isCreating}
      />

      <ClientSecretDialog
        isOpen={!!createdClient}
        onClose={() => setCreatedClient(null)}
        clientId={createdClient?.clientId}
        clientSecret={createdClient?.clientSecret}
      />
    </Container>
  )
}

export default OAuthClientsManager

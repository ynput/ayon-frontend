import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Panel, LockedInput, Icon } from '@ynput/ayon-react-components'
import { useUpdateUserAPIKeyMutation } from '../services/user/updateUser'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import { confirmDialog } from 'primereact/confirmdialog'

const PanelStyled = styled(Panel)`
  flex-direction: row;
  background-color: var(--md-sys-color-surface-container);
  align-items: center;

  span {
    cursor: pointer;
    margin-left: auto;
  }
`

const ApiKeyManager = ({ preview, name }) => {
  // temp hold new key
  const [newKey, setNewKey] = useState(null)
  // loading state
  const [loading, setLoading] = useState(false)

  // if name changes clear new key
  useEffect(() => {
    setNewKey(null)
  }, [name])

  //   update apikey mutation
  const [updateApi] = useUpdateUserAPIKeyMutation()

  // generate new api token using uuid4
  const createNewKey = async () => {
    setLoading(true)
    const key = uuidv4().replace(/-/g, '')

    // try catch to update api key using unwrap and toaste results
    try {
      await updateApi({
        name,
        apiKey: key,
      }).unwrap()

      setNewKey({ key, preview: true })

      toast.success('API Key Created')
    } catch (error) {
      console.log(error)
      //   toast error
      toast.error('Error updating API Key')
    } finally {
      setLoading(false)
    }
  }
  const handleDelete = async (e) => {
    e.preventDefault()

    // check if target is an input and do nothing
    if (e.target.tagName === 'INPUT') return

    confirmDialog({
      message: `Delete key: ${preview || newKey.preview}?`,
      header: 'Delete service key',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        // try catch to update api key using unwrap and toast results
        try {
          await updateApi({
            name,
            apiKey: null,
          }).unwrap()

          setNewKey(null)

          toast.success('API Key Deleted')
        } catch (error) {
          console.log(error)
          //   toast error
          toast.error('Error deleting API Key')
        }
      },
      reject: () => {},
    })
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(newKey.key)
    toast.success('API Key Copied')
  }

  if (preview || newKey?.key)
    return (
      <>
        <LockedInput
          value={preview || newKey?.preview}
          onEdit={handleDelete}
          editIcon={'delete'}
          label={'Api Key'}
        />
        {newKey && (
          <PanelStyled>
            <div>
              <strong>{newKey.key}</strong>
              <br />
              <div style={{ opacity: 0.5 }}>
                Make a copy of this key as you will only see it once!
              </div>
            </div>
            <Icon onClick={handleCopyKey} icon="content_copy" />
          </PanelStyled>
        )}
      </>
    )

  return (
    <LockedInput
      onEdit={createNewKey}
      label="API Key"
      editIcon={loading ? 'sync' : 'add'}
      value={loading ? 'Creating...' : 'Generate new key...'}
    />
  )
}

ApiKeyManager.propTypes = {
  preview: PropTypes.string,
  name: PropTypes.string.isRequired,
}

export default ApiKeyManager

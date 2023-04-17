import React from 'react'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Panel, LockedInput } from '@ynput/ayon-react-components'
import { useUpdateUserAPIKeyMutation } from '../services/user/updateUser'
import { toast } from 'react-toastify'
import styled from 'styled-components'

const PanelStyled = styled(Panel)`
  flex-direction: row;
  background-color: var(--color-grey-01);
  align-items: center;

  span {
    cursor: pointer;
    margin-left: auto;
  }
`

const ApiKeyManager = ({ preview, name }) => {
  // temp hold new key
  const [newKey, setNewKey] = useState()

  //   update apikey mutation
  const [updateApi] = useUpdateUserAPIKeyMutation()

  // generate new api token using uuid4
  const createNewKey = async () => {
    const key = uuidv4().replace(/-/g, '')

    // try catch to update api key using unwrap and toaste results
    try {
      const res = await updateApi({
        name,
        apiKey: key,
      }).unwrap()

      setNewKey({ key, preview: res })

      toast.success('API Key Created')
    } catch (error) {
      console.log(error)
      //   toast error
      toast.error('Error updating API Key')
    }
  }
  const handleDelete = async () => {
    // try catch to update api key using unwrap and toaste results
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
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(newKey.key)
    toast.success('API Key Copied')
  }

  if (preview)
    return (
      <>
        <LockedInput
          value={preview || newKey.preview}
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
            <span className="material-symbols-outlined" onClick={handleCopyKey}>
              content_copy
            </span>
          </PanelStyled>
        )}
      </>
    )

  return (
    <LockedInput
      onEdit={createNewKey}
      label="API Key"
      editIcon="add"
      placeholder="Create API Key..."
    />
  )
}

ApiKeyManager.propTypes = {
  preview: PropTypes.string,
  name: PropTypes.string.isRequired,
}

export default ApiKeyManager

import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Panel, LockedInput, Icon } from '@ynput/ayon-react-components'
import { useUpdateUserAPIKeyMutation } from '@queries/user/updateUser'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import { confirmDelete } from '@shared/helpers'
import copyToClipboard from '@helpers/copyToClipboard'

const PanelStyled = styled(Panel)`
  flex-direction: row;
  background-color: var(--md-sys-color-surface-container);
  align-items: center;

  span {
    cursor: pointer;
    margin-left: auto;
  }
`
const PanelStyledLightBackground = styled(PanelStyled)`
  background-color: var(--md-sys-color-surface-container-high);
`

const ApiKeyManager = ({
  preview,
  name,
  autosave = true,
  onGenerate,
  repeatGenerate = true,
  lightBackground = false,
}) => {
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
    if (!autosave) {
      setNewKey({ key, preview: true })
      setLoading(false)
      onGenerate && onGenerate(key)
      return
    }

    // try catch to update api key using unwrap and toaste results
    try {
      await updateApi({
        name,
        apiKey: key,
      }).unwrap()

      setNewKey({ key, preview: true })

      onGenerate && onGenerate(key)

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

    if (!autosave) {
      setNewKey(null)
      return
    }

    confirmDelete({
      label: 'Service Key',
      accept: async () => {
        await updateApi({
          name,
          apiKey: null,
        }).unwrap()

        setNewKey(null)
      },
    })
  }

  const handleCopyKey = () => {
    copyToClipboard(newKey.key)
  }
  const Panel = lightBackground ? PanelStyledLightBackground : PanelStyled

  if (preview || newKey?.key)
    return (
      <>
        {repeatGenerate && (
          <LockedInput
            value={preview || newKey?.preview}
            onEdit={handleDelete}
            editIcon={'delete'}
            label={'Api Key'}
          />
        )}
        {newKey && (
          <Panel>
            <div>
              <strong>{newKey.key}</strong>
              <br />
              <div style={{ opacity: 0.5 }}>
                Make a copy of this key as you will only see it once!
              </div>
            </div>
            <Icon onClick={handleCopyKey} icon="content_copy" />
          </Panel>
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

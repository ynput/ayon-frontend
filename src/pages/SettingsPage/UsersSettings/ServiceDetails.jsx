import React from 'react'
import PropTypes from 'prop-types'
import { LockedInput, Panel, FormLayout, FormRow } from '@ynput/ayon-react-components'
import ApiKeyManager from '@components/ApiKeyManager'
import { EditableLockedInput } from './userDetail.styled'

const ServiceDetails = ({ user, editName, flat }) => {
  // flat settings layout: a titled card of labelled rows, like a user's profile
  if (flat)
    return (
      <Panel>
        <b className="flat-form-title">Profile</b>
        <FormLayout>
          <FormRow label="Username">
            <EditableLockedInput value={user.name} onEdit={editName} />
          </FormRow>
          <FormRow label="API key">
            <ApiKeyManager preview={user.apiKeyPreview} name={user.name} />
          </FormRow>
        </FormLayout>
      </Panel>
    )

  return (
    <Panel>
      <LockedInput value={user.name} label={'Username'} onEdit={editName} />
      <ApiKeyManager preview={user.apiKeyPreview} name={user.name} />
    </Panel>
  )
}

ServiceDetails.propTypes = {
  user: PropTypes.object,
  editName: PropTypes.func,
  flat: PropTypes.bool,
}

export default ServiceDetails

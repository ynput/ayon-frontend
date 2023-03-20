import React from 'react'
import PropTypes from 'prop-types'
import OAuth2ProviderIcon from '/src/components/oauthIcons'
import { upperFirst } from 'lodash'
import { Button } from '@ynput/ayon-react-components'

const AuthLink = ({ url, name }) => {
  return (
    <a href={url} key={name} title={name}>
      <Button
        style={{ maxHeight: 'none' }}
        label={
          <>
            <OAuth2ProviderIcon name={name} />
            <h2>{'Login With ' + upperFirst(name)}</h2>
          </>
        }
      />
    </a>
  )
}

AuthLink.propTypes = {
  url: PropTypes.string,
  name: PropTypes.string,
}

export default AuthLink

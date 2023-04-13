import React from 'react'

import PropTypes from 'prop-types'
import OAuth2ProviderIcon from '/src/components/oauthIcons'
import { upperFirst } from 'lodash'
import { Button } from '@ynput/ayon-react-components'

const AuthLink = ({ url, name, icon, color, textColor }) => {
  const colours = {
    discord: '#5765F2',
    slack: '#4A154B',
    google: '#D34836',
  }

  const colour = color || colours[name] || 'initial'
  const textColour = textColor || 'white'

  return (
    <a href={url} key={name} title={name}>
      <Button
        style={{
          maxHeight: 'none',
          backgroundColor: colour,
          color: textColour,
        }}
        label={
          <>
            {icon ? (
              <img src={icon} style={{ height: 36, width: 'auto' }} />
            ) : (
              <OAuth2ProviderIcon name={name} />
            )}
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

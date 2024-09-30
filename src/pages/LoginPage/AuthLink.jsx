import React from 'react'

import PropTypes from 'prop-types'
import OAuth2ProviderIcon from '@components/oauthIcons'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const AuthButton = styled(Button)`
  max-height: none;

  transition: filter 0.2s;
  &:hover {
    filter: brightness(1.2);
  }
`

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
      <AuthButton
        style={{
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
            <span className="label">{'Login with ' + name}</span>
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

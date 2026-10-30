import OAuth2ProviderIcon from './OAuthIcons'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const AuthButton = styled(Button)`
  max-height: none;

  transition: filter 0.2s;
  &:hover {
    filter: brightness(1.2);
  }
`

interface AuthLinkProps {
  url: string
  name: string
  icon?: string
  color?: string
  textColor?: string
}

const AuthLink = ({ url, name, icon, color, textColor }: AuthLinkProps) => {
  const colours: Record<string, string> = {
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
        // the button lays out its label, which can be any node
        label={
          (<>
            {icon ? (
              <img src={icon} style={{ height: 36, width: 'auto' }} />
            ) : (
              <OAuth2ProviderIcon name={name} />
            )}
            <span className="label">{'Login with ' + name}</span>
          </>) as unknown as string
        }
      />
    </a>
  )
}

export default AuthLink

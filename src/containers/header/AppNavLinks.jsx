import { Button, Spacer } from '@ynput/ayon-react-components'
import { NavLink } from 'react-router-dom'
import Typography from '@/theme/typography.module.css'
import * as Styled from './AppNavLinks.styled'
import { useAppNavLinks } from './hooks/useAppNavLinks'

const AppNavLinks = ({ links = [], actions = [] }) => {
  // linkItem = { name: 'name', path: 'path', node: node | 'spacer', accessLevel: [] }

  return (
    <Styled.NavBar className="secondary">
      <AppNavLeftLinks links={links} />
      <AppNavRightActionButtons actions={actions} />
    </Styled.NavBar>
  )
}

const AppNavLeftLinks = ({ links }) => {
  const { filteredItems, appendUri } = useAppNavLinks(links)

  return (
    <Styled.NavLinksContainer>
      <ul>
        {filteredItems.map(({ node, enabled = true, ...rest }, idx) => {
          if (!enabled) return null

          if (node) {
            if (node === 'spacer') return <Spacer key={idx} />
            return <li key={idx}>{node}</li>
          }

          return (
            <Styled.NavItem key={idx} {...rest}>
              <NavLink to={appendUri(rest.path, rest.uriSync)}>
                <Button variant="nav" className={Typography.titleSmall} tabIndex={-1}>
                  {rest.startContent}
                  {rest.name}
                  {rest.endContent}
                </Button>
              </NavLink>
            </Styled.NavItem>
          )
        })}
      </ul>
    </Styled.NavLinksContainer>
  )
}

const AppNavRightActionButtons = ({ actions }) => {
  if (!actions || actions.length === 0) return null

  return <Styled.NavRightActions>{actions}</Styled.NavRightActions>
}

export default AppNavLinks

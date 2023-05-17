import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button, Spacer, UserImage } from '@ynput/ayon-react-components'

import Breadcrumbs from './breadcrumbs'
import UserMenu from './userMenu'
import ProjectMenu from './projectMenu'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

const StyledButton = styled(Button)`
  max-height: unset;
  min-height: unset;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;

  background-color: transparent;
  padding: 4px;

  & > span {
    font-size: 26px !important;
  }
`

const Header = () => {
  const [projectMenuVisible, setProjectMenuVisible] = useState(false)
  const [userMenuVisible, setUserMenuVisible] = useState(false)
  const location = useLocation()
  // get user from redux store
  const user = useSelector((state) => state.user)

  // Hide sidebars when location changes
  useEffect(() => {
    setProjectMenuVisible(false)
    setUserMenuVisible(false)
  }, [location.pathname])

  return (
    <nav className="primary">
      <ProjectMenu visible={projectMenuVisible} onHide={() => setProjectMenuVisible(false)} />
      <UserMenu visible={userMenuVisible} onHide={() => setUserMenuVisible(false)} />

      <StyledButton
        icon="dataset"
        label="Projects"
        onClick={() => setProjectMenuVisible(true)}
        style={{
          alignItems: 'center',
          display: 'flex',
        }}
      />

      <Spacer>
        <Breadcrumbs />
      </Spacer>
      <StyledButton icon="apps" onClick={() => setUserMenuVisible(true)} />
      <Link to="/profile">
        <StyledButton>
          <UserImage size={26} src={user?.attrib?.avatarUrl} fullName={user?.attrib?.fullName} />
        </StyledButton>
      </Link>
    </nav>
  )
}

export default Header

import React from 'react'
import * as Styled from './UserDashboardNoProjects.styled'
import NoProducts from '../../BrowserPage/NoProducts'
import { Button } from '@ynput/ayon-react-components'
import { Link } from 'react-router-dom'

const UserDashboardNoProjects = () => {
  return (
    <Styled.Container>
      <NoProducts label="No Projects" />
      <Link to="/manageProjects/new">
        <Button label="Create first project" variant="filled" icon="create_new_folder" />
      </Link>
    </Styled.Container>
  )
}

export default UserDashboardNoProjects

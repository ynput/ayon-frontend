import React, { useState } from 'react'
import * as Styled from './UserDashboardNoProjects.styled'
import NoProducts from '../../BrowserPage/Products/NoProducts'
import { Button } from '@ynput/ayon-react-components'
import NewProjectDialog from '../../ProjectManagerPage/NewProjectDialog'
import { useNavigate } from 'react-router'

const UserDashboardNoProjects = () => {
  const [openNewProject, setOpenNewProject] = useState()
  const navigate = useNavigate()

  return (
    <Styled.Container>
      <NoProducts label="No Projects" />

      <Button
        label="Create first project"
        variant="filled"
        icon="create_new_folder"
        onClick={() => setOpenNewProject(true)}
      />
      {openNewProject && (
        <NewProjectDialog
          onHide={(name) => {
            setOpenNewProject(false)
            if (name) navigate(`/manageProjects/anatomy?project=${name}`)
          }}
        />
      )}
    </Styled.Container>
  )
}

export default UserDashboardNoProjects

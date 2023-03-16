import React from 'react'
import PropTypes from 'prop-types'
import { useGetUsersAssigneeQuery } from '/src/services/user/getUsers'
import AssigneeField from './AssigneeField'

const AssigneeFieldWrapper = ({ names }) => {
  let { data: users } = useGetUsersAssigneeQuery({ names })

  users = [
    {
      name: 'demouser00',
      avatarUrl: 'https://repo.imm.cz/avatars/demouser00.jpg',
      fullName: 'Wiktor Hokstad',
    },
    {
      name: 'demouser10',
      avatarUrl: '',
      fullName: 'Frank Hokstad',
    },
    {
      name: 'demouser20',
      avatarUrl: 'https://repo.imm.cz/avatars/demouser20.jpg',
      fullName: 'Frank Hokstad',
    },
  ]

  return <AssigneeField value={users} />
}

AssigneeFieldWrapper.propTypes = {
  users: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
}

export default AssigneeFieldWrapper

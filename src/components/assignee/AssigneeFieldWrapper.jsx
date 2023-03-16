import React from 'react'
import PropTypes from 'prop-types'
import { useGetUsersAssigneeQuery } from '/src/services/user/getUsers'
import AssigneeField from './AssigneeField'

const AssigneeFieldWrapper = (props) => {
  const { names } = props
  let { data: users = [] } = useGetUsersAssigneeQuery({ names })

  return <AssigneeField value={[...users, ...users, ...users]} {...props} />
}

AssigneeFieldWrapper.propTypes = {
  names: PropTypes.arrayOf(PropTypes.string).isRequired,
}

export default AssigneeFieldWrapper

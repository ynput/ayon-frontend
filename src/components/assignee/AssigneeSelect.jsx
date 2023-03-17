import React from 'react'
import PropTypes from 'prop-types'
import { useGetUsersAssigneeQuery } from '/src/services/user/getUsers'
import AssigneeField from './AssigneeField'
import Dropdown from '../dropdown'
import AssigneeDropdown from './AssigneeDropdown'

const AssigneeSelect = (props) => {
  const { names, editor, align, onChange, widthExpand } = props
  //   Queries
  const { data: users = [] } = useGetUsersAssigneeQuery({ names }, { skip: !names.length })
  const { data: allUsers = [] } = useGetUsersAssigneeQuery({ names: undefined }, { skip: !editor })

  if (!editor) return <AssigneeField value={users} {...props} />

  return (
    <Dropdown
      value={names}
      valueItem={() => <AssigneeField value={users} {...props} />}
      options={allUsers}
      valueField={'name'}
      optionsItem={(user, isActive, isSelected) => (
        <AssigneeDropdown {...user} isActive={isActive} isSelected={isSelected} />
      )}
      onChange={onChange}
      widthExpand={widthExpand}
      align={align}
      multiSelect
      search
      searchFields={['name', 'fullName']}
    />
  )
}

AssigneeSelect.propTypes = {
  names: PropTypes.arrayOf(PropTypes.string).isRequired,
  editor: PropTypes.bool,
  onChange: PropTypes.func,
  widthExpand: PropTypes.bool,
}

export default AssigneeSelect

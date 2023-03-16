import React from 'react'
import PropTypes from 'prop-types'
import { useGetUsersAssigneeQuery } from '/src/services/user/getUsers'
import AssigneeField from './AssigneeField'
import Dropdown from '../dropdown'
import { useState } from 'react'
import { useEffect } from 'react'
import AssigneeDropdown from './AssigneeDropdown'
import { isEqual } from 'lodash'

const AssigneeSelect = (props) => {
  const { names, editor, align, onChange, widthExpand } = props
  //   Queries
  const { data: users = [] } = useGetUsersAssigneeQuery({ names }, { skip: !names.length })
  const { data: allUsers = [] } = useGetUsersAssigneeQuery({ names: undefined }, { skip: !editor })

  //   states
  const [selected, setSelected] = useState([])

  useEffect(() => {
    setSelected(names)
  }, [names, setSelected])

  if (!editor) return <AssigneeField value={users} {...props} />

  const handleChange = (value) => {
    const newSelected = [...selected]
    // add/remove from selected
    if (newSelected.includes(value)) {
      // remove
      newSelected.splice(newSelected.indexOf(value), 1)
    } else {
      // add
      newSelected.push(value)
    }
    // update state
    setSelected(newSelected)
  }

  const handleClose = async () => {
    // check for difs
    if (isEqual(selected, names)) return
    console.log('dif')
    // commit changes
    onChange && onChange(selected)
    //   reset selected
    setSelected([])
  }

  return (
    <Dropdown
      value={<AssigneeField value={users} {...props} />}
      widthExpand={widthExpand}
      options={allUsers.map((user) => (
        <AssigneeDropdown
          {...user}
          key={user.name}
          isSelected={selected.includes(user.name)}
          isActive={names.includes(user.name)}
          onClick={() => handleChange(user.name)}
        />
      ))}
      align={align}
      multiSelect
      onClose={handleClose}
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

import React from 'react'
import { useSelector } from 'react-redux'
import Menu from '/src/components/Menu/MenuComponents/Menu'

const ColumnMenu = ({ onCollapse, ...props }) => {
  const user = useSelector((state) => state.user)
  const isUser = user.data.isUser

  const items = [
    {
      id: 'collapse',
      label: 'Collapse',
      onClick: onCollapse,
    },
  ]

  if (!isUser) {
    // items.push({
    //   id: 'merge',
    //   label: 'Merge Into',
    //   items: [
    //     {
    //       id: 'column-1',
    //       label: 'Column 1',
    //     },
    //     {
    //       id: 'column-2',
    //       label: 'Column 2',
    //     },
    //   ],
    // })
  }

  return <Menu menu={items} {...props} compact />
}

export default ColumnMenu

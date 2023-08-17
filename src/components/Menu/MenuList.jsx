import React from 'react'
import { useNavigate } from 'react-router'
import MenuItem from './MenuItem'
import * as Styled from './Menu.styled'
import Colors from '/src/theme/colors.module.scss'

const MenuList = ({
  items = [],
  onChange,
  onClose,
  disabledClose = false,
  footer = '',
  index,
  ...props
}) => {
  const navigate = useNavigate()

  //   When a menu item is clicked, the following happens:
  const handleClick = (e, onClick, url) => {
    if (!disabledClose && onClose) onClose()
    onClick && onClick(e)

    if (url) {
      if (url.startsWith('http')) {
        window.open(url, '_blank')
      } else {
        navigate(url)
      }
    }
  }

  return (
    <Styled.Section className={`${Colors['on-surface-text']}`}>
      <Styled.Menu>
        {items.map((item, i) => {
          // if item is a node, return it
          if (item.node)
            return (
              <li onClick={onChange} key={i} id={item?.id}>
                {item.node}
              </li>
            )

          if (item?.id === 'divider') return <hr key={i} />

          const { label, icon, highlighted, onClick, url } = item

          return (
            <li key={i}>
              <MenuItem
                {...{ label, icon, highlighted }}
                onClick={(e) => handleClick(e, onClick, url)}
                autoFocus={index === 0 && i === 0}
                {...props}
              />
            </li>
          )
        })}
      </Styled.Menu>
      {footer && (
        <Styled.Footer className={`${Colors['surface-container-low']}`}>{footer}</Styled.Footer>
      )}
    </Styled.Section>
  )
}

export default MenuList

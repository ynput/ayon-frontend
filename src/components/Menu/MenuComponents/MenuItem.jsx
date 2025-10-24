import { Icon, ShortcutTag } from '@ynput/ayon-react-components'
import { forwardRef, useState, useRef, useLayoutEffect, useEffect } from 'react'
import * as Styled from './Menu.styled'
import { isArray } from 'lodash'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { usePowerpack } from '@shared/context'
import MenuList from './MenuList'

const MenuItem = forwardRef(
  (
    {
      label,
      icon,
      img,
      highlighted,
      notification,
      selected,
      danger,
      items = [],
      className,
      isLink,
      isDev,
      shortcut,
      disabled,
      powerFeature,
      active,
      // Props for submenu handling
      menuRef,
      handleClick,
      level = 0,
      itemId,
      parentRef,
      onClose,
      onMenuClose,
      setPowerpackDialog,
      itemStyle,
      itemClassName,
      onClick,
      disableClose,
      target,
      ...props
    },
    forwardedRef,
  ) => {
    const labelsArray = isArray(label) ? label : [label]
    const { powerLicense, isLoading } = usePowerpack()
    const isPowerFeature = !powerLicense && powerFeature
    const hasChildren = items.length > 0

    // Submenu state
    const [subMenuOpen, setSubMenuOpen] = useState(false)
    const [subMenuStyle, setSubMenuStyle] = useState({})
    const [subMenuWidth, setSubMenuWidth] = useState(null)
    const itemRef = useRef(null)
    const subMenuRef = useRef(null)
    const closeTimeoutRef = useRef(null)

    // Measure submenu width after first render
    useLayoutEffect(() => {
      if (!subMenuOpen || !subMenuRef.current || subMenuWidth !== null) return

      // Find the MenuWrapper inside the subMenuRef
      const menuWrapper = subMenuRef.current.querySelector('[class*="MenuWrapper"]')
      const rect = menuWrapper?.getBoundingClientRect() || subMenuRef.current.getBoundingClientRect()

      console.log('Measuring submenu:', {
        hasSubMenuRef: !!subMenuRef.current,
        hasMenuWrapper: !!menuWrapper,
        width: rect.width,
        items: items.length
      })

      if (rect.width > 0) {
        setSubMenuWidth(rect.width)
      }
    }, [subMenuOpen, subMenuWidth])

    const calculateSubMenuPosition = () => {
      if (!itemRef.current || !menuRef?.current) return

      const menuRect = menuRef.current.getBoundingClientRect()
      const itemRect = itemRef.current.getBoundingClientRect()

      if (!menuRect || !itemRect) return

      // Calculate top position - use absolute viewport coordinates for fixed positioning
      const baseTop = itemRect.top - 8

      const GAP = 12
      const viewportWidth = window.innerWidth
      const childWidth = subMenuWidth || 200

      // Calculate available space on both sides
      const spaceOnRight = viewportWidth - menuRect.right
      const spaceOnLeft = menuRect.left

      // Determine direction
      const shouldOpenRight = spaceOnRight >= childWidth + GAP + 20
      const shouldOpenLeft = !shouldOpenRight && spaceOnLeft >= childWidth + GAP + 20

      // Calculate horizontal position
      let leftPosition
      if (shouldOpenRight) {
        leftPosition = menuRect.right + GAP
      } else if (shouldOpenLeft) {
        leftPosition = menuRect.left - childWidth - GAP
      } else {
        leftPosition = menuRect.right + GAP
      }

      setSubMenuStyle({
        top: baseTop,
        left: leftPosition,
      })
    }

    const handleMouseEnter = (e) => {
      console.log('handleMouseEnter called', { hasChildren, label })

      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }

      if (hasChildren) {
        console.log('Setting subMenuOpen to true for', label)
        setSubMenuOpen(true)
        // Recalculate position on every hover
        requestAnimationFrame(() => {
          calculateSubMenuPosition()
        })
      }
    }

    const handleMouseLeave = () => {
      if (hasChildren) {
        // Small delay before closing to allow moving to submenu
        closeTimeoutRef.current = setTimeout(() => {
          // setSubMenuOpen(false)
          setSubMenuWidth(null)
        }, 300)
      }
    }

    const handleSubMenuMouseEnter = () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }

    const handleSubMenuMouseLeave = () => {
      // setSubMenuOpen(false)
      setSubMenuWidth(null)
    }

    useEffect(() => {
      return () => {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current)
        }
      }
    }, [])

    const handleClickPowerFeature = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setPowerpackDialog(powerFeature)
      onMenuClose && onMenuClose()
    }

    const handleItemClick = (e) => {
      if (isPowerFeature) {
        handleClickPowerFeature(e)
      } else if (hasChildren) {
        // Hover handled by onMouseEnter
        return
      } else {
        handleClick && handleClick(e, onClick, isLink, disableClose)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (isPowerFeature) {
          handleClickPowerFeature(e)
        } else if (!hasChildren) {
          handleClick && handleClick(e, props.onClick, isLink)
        }
      }

      if (e.key === 'Escape' && level > 0 && parentRef) {
        e.preventDefault()
        e.stopPropagation()
        parentRef.focus()
        onClose && onClose(itemId)
      }
    }

    const Item = (
      <Styled.Item
        ref={(el) => {
          itemRef.current = el
          if (forwardedRef) {
            if (typeof forwardedRef === 'function') {
              forwardedRef(el)
            } else {
              forwardedRef.current = el
            }
          }
        }}
        className={clsx(
          'menu-item',
          {
            highlighted: highlighted,
            selected: selected,
            notification: notification,
            danger: danger,
            dev: isDev,
            disabled: disabled || isLoading,
            power: isPowerFeature,
          },
          className,
          itemClassName,
        )}
        {...props}
        label={labelsArray.join(', ')}
        onClick={handleItemClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{ paddingRight: hasChildren ? '0' : undefined, ...itemStyle }}
      >
        {(icon || isPowerFeature) && <Icon icon={isPowerFeature ? 'bolt' : icon} />}
        {img && <Styled.Img src={img} alt={`${label} icon`} />}
        {labelsArray.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
        {shortcut && (
          <ShortcutTag style={{ minWidth: 22, textAlign: 'center' }} align={'right'}>
            {shortcut}
          </ShortcutTag>
        )}
        {active && <Icon icon="check" style={{ marginLeft: 'auto' }} />}

        {!!items.length && <Icon icon="arrow_right" className="more" />}
      </Styled.Item>
    )

    const ItemWrapper = isLink ? (
      <Link to={isLink} target={target}>
        {Item}
      </Link>
    ) : (
      Item
    )

    // If no children, just return the item
    if (!hasChildren) {
      return ItemWrapper
    }

    console.log('MenuItem render:', {
      label,
      hasChildren,
      subMenuOpen,
      subMenuWidth,
      itemsCount: items.length,
      subMenuStyle
    })

    return (
      <>
        {ItemWrapper}
        {subMenuOpen && (
          <div
            ref={subMenuRef}
            onMouseEnter={handleSubMenuMouseEnter}
            onMouseLeave={handleSubMenuMouseLeave}
            style={{
              position: 'fixed',
              top: subMenuStyle.top,
              left: subMenuStyle.left,
              opacity: subMenuWidth ? 1 : 0,
              visibility: subMenuWidth ? 'visible' : 'hidden',
              transition: 'opacity 0.1s ease',
              pointerEvents: subMenuWidth ? 'auto' : 'none',
              zIndex: 1001,
              border: '2px solid red', // Debug border
            }}
          >
            <MenuList
              items={items}
              handleClick={handleClick}
              level={level + 1}
              id={`${itemId}-submenu`}
              parentRef={itemRef}
              menuRef={subMenuRef}
              style={{}}
              onClose={() => {
                setSubMenuOpen(false)
                setSubMenuWidth(null)
              }}
              onMenuClose={onMenuClose}
              itemClassName={itemClassName}
              itemStyle={itemStyle}
              setPowerpackDialog={setPowerpackDialog}
            />
          </div>
        )}
      </>
    )
  },
)

MenuItem.displayName = 'MenuItem'

export default MenuItem

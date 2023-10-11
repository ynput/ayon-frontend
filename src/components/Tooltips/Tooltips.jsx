import React, { useEffect, useRef, useState } from 'react'
import * as Styled from './Tooltips.styled'
import { isEqual, snakeCase } from 'lodash'

const getTooltipId = (tooltip, shortcut) => {
  return snakeCase(tooltip + '-' + shortcut)
}

const Tooltips = ({ render }) => {
  const tooltipRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  const getTooltipPos = (target, ref) => {
    if (!target || !ref.current) return
    const tooltipRect = ref.current.getBoundingClientRect()
    const tooltipWidth = tooltipRect.width
    const tooltipHeight = tooltipRect.height

    // set tooltip left position
    const tooltipLeft = target.x - tooltipWidth / 2
    // set tooltip top position
    const tooltipTop = target.y - tooltipHeight - 10

    // make sure tooltip is not outside of viewport
    if (tooltipLeft < 0) {
      // if tooltip is outside left side of viewport, move it to the right
      return { x: 4, y: tooltipTop }
    } else if (window.innerWidth < tooltipLeft + tooltipWidth) {
      // if tooltip is outside right side of viewport, move it to the left
      return { x: window.innerWidth - tooltipWidth - 4, y: tooltipTop }
    }

    return { x: tooltipLeft, y: tooltipTop }
  }

  const [timeoutId, setTimeoutId] = useState(null)
  const [isActive, setIsActive] = useState(false)

  // when tooltip changes, update tooltip position using target position
  useEffect(() => {
    if (!tooltip) {
      // if tooltipPos is set, reset it
      if (timeoutId && !tooltip) {
        clearTimeout(timeoutId)
      }
      return
    }

    const id = getTooltipId(tooltip?.tooltip, tooltip?.shortcut)

    // new tooltip is set, but it's ref hasn't updated yet
    if (id !== tooltipRef.current.id) return

    const newTooltipPos = getTooltipPos(tooltip?.target, tooltipRef)

    if (isActive && isEqual(tooltip?.pos, newTooltipPos)) return
    // update state
    if (timeoutId) clearTimeout(timeoutId)

    if (isActive) {
      setTooltip((t) => {
        if (tooltip?.id !== t?.id) return { ...t, pos: newTooltipPos, hide: true }
        return { ...t, pos: newTooltipPos, hide: false }
      })
      setTimeoutId(null)
    } else {
      setIsActive(true)
      setTimeoutId(
        setTimeout(() => setTooltip((t) => ({ ...t, pos: newTooltipPos, hide: false })), 350),
      )
    }
  }, [tooltip, setTooltip])

  // once tooltip has been null for 350ms, set noTimeOut to false
  const [activeTimeoutId, setActiveTimeoutId] = useState(null)
  useEffect(() => {
    if (!tooltip && !activeTimeoutId) {
      setActiveTimeoutId(setTimeout(() => setIsActive(false), 350))
    } else if (activeTimeoutId) {
      clearTimeout(activeTimeoutId)
      setActiveTimeoutId(null)
    }
  }, [tooltip])

  const handleMouse = (e) => {
    const target = e.target.closest('[data-tooltip], [data-shortcut]')
    if (!target) {
      if (tooltip) {
        setTooltip(null)
      }
      return
    }

    const tooltipData = target?.dataset?.tooltip
    const shortcutData = target?.dataset?.shortcut
    // check if data-tooltip attribute exists
    if (!tooltipData && !shortcutData) {
      setTooltip(null)
      return
    }

    const id = getTooltipId(tooltipData, shortcutData)

    // don't rerender if tooltip is already set to same value
    if (tooltip?.id === id) return

    // find center top position of target element
    const targetRect = target.getBoundingClientRect()
    // target center will also be tooltip left
    const targetCenter = targetRect.left + targetRect.width / 2
    // target top will also be tooltip bottom
    const targetTop = target.getBoundingClientRect().top

    const newTargetPos = { x: targetCenter, y: targetTop }
    const newTooltip = {
      tooltip: tooltipData ?? '',
      shortcut: shortcutData ?? '',
      target: newTargetPos,
      id,
      hide: false,
    }

    // check if tooltip is already set to same value
    if (isEqual(tooltip, newTooltip) && isEqual(tooltip?.target, newTargetPos)) return

    setTooltip(newTooltip)
  }

  const hideTooltip = !tooltip?.pos || tooltip?.hide

  return (
    <>
      {render({
        onMouseOver: handleMouse,
        onMouseOut: handleMouse,
      })}

      <Styled.TooltipWidget
        ref={tooltipRef}
        key={getTooltipId(tooltip?.tooltip, tooltip?.shortcut)}
        id={getTooltipId(tooltip?.tooltip, tooltip?.shortcut)}
        className={tooltip?.tooltip ? 'tooltip' : 'tooltip hidden'}
        style={{
          display: tooltip ? 'flex' : 'none',
          visibility: hideTooltip ? 'hidden' : 'visible',
          opacity: hideTooltip ? 0 : 1,
          left: tooltip?.pos?.x || 0,
          top: tooltip?.pos?.y || 0,
          padding: tooltip?.tooltip ? '6px 8px' : 6,
        }}
        $targetPos={tooltip?.target}
      >
        {tooltip?.tooltip}
        {tooltip?.shortcut && <Styled.Shortcut>{tooltip?.shortcut}</Styled.Shortcut>}
      </Styled.TooltipWidget>
    </>
  )
}

export default Tooltips

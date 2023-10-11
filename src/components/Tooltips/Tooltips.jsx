import React, { useEffect, useRef, useState } from 'react'
import * as Styled from './Tooltips.styled'
import { isEqual } from 'lodash'

const Tooltips = ({ render }) => {
  const tooltipRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [targetPos, setTargetPos] = useState(null)

  const getTooltipPos = (target, ref) => {
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

  const [tooltipPos, setTooltipPos] = useState(null)
  const [timeoutId, setTimeoutId] = useState(null)
  const [isActive, setIsActive] = useState(false)

  // when tooltip changes, update tooltip position using target position
  useEffect(() => {
    if (!tooltip || !targetPos) {
      // if tooltipPos is set, reset it
      if (tooltipPos) setTooltipPos(null)
      if (timeoutId && !tooltip) {
        clearTimeout(timeoutId)
      }
      return
    }

    const newTooltipPos = getTooltipPos(targetPos, tooltipRef)

    if (isActive && isEqual(tooltipPos, newTooltipPos)) return
    // update state
    if (timeoutId) clearTimeout(timeoutId)

    if (isActive) {
      setTooltipPos(newTooltipPos)
      setTimeoutId(null)
    } else {
      setIsActive(true)
      setTimeoutId(setTimeout(() => setTooltipPos(newTooltipPos), 350))
    }
  }, [tooltip, targetPos, tooltipPos])

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
        setTargetPos(null)
      }
      return
    }

    const tooltipData = target?.dataset?.tooltip
    const shortcutData = target?.dataset?.shortcut
    // check if data-tooltip attribute exists
    if (!tooltipData && !shortcutData) {
      setTargetPos(null)
      setTooltip(null)
      setTargetPos(null)
      return
    }

    // find center top position of target element
    const targetRect = target.getBoundingClientRect()
    // target center will also be tooltip left
    const targetCenter = targetRect.left + targetRect.width / 2
    // target top will also be tooltip bottom
    const targetTop = target.getBoundingClientRect().top

    const newTooltip = {
      tooltip: tooltipData ?? '',
      shortcut: shortcutData ?? '',
    }

    const newTargetPos = { x: targetCenter, y: targetTop }

    // check if tooltip is already set to same value
    if (isEqual(tooltip, newTooltip) && isEqual(targetPos, newTargetPos)) return

    setTargetPos(null)
    setTooltip(newTooltip)
    setTargetPos(newTargetPos)
  }

  console.log(tooltip, tooltipPos)

  return (
    <>
      {render({
        onMouseOver: (e) => handleMouse(e, tooltip),
        onMouseOut: handleMouse,
      })}

      <Styled.TooltipWidget
        ref={tooltipRef}
        className={tooltip?.tooltip ? 'tooltip' : 'tooltip hidden'}
        style={{
          display: tooltip ? 'flex' : 'none',
          visibility: tooltipPos ? 'visible' : 'hidden',
          opacity: tooltipPos ? 1 : 0,
          left: tooltipPos?.x || 0,
          top: tooltipPos?.y || 0,
          padding: tooltip?.tooltip ? '6px 8px' : 6,
        }}
        $targetPos={targetPos}
      >
        {tooltip?.tooltip}
        {tooltip?.shortcut && <Styled.Shortcut>{tooltip?.shortcut}</Styled.Shortcut>}
      </Styled.TooltipWidget>
    </>
  )
}

export default Tooltips

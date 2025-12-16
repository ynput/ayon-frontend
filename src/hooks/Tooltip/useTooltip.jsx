import { isEqual, snakeCase } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import * as Styled from './Tooltip.styled'
import rehypeExternalLinks from 'rehype-external-links'
import { ShortcutTag } from '@ynput/ayon-react-components'

const getTooltipId = (tooltip, shortcut, id) => {
  return snakeCase(tooltip + ' ' + shortcut + ' ' + id)
}

const useTooltip = () => {
  const tooltipRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [hasOverflow, setHasOverflow] = useState(false)

  // callback ref to detect overflow when tooltip inner mounts/updates
  const tooltipInnerRef = useCallback((node) => {
    if (!node) {
      setHasOverflow(false)
      return
    }

    // check if content overflows
    const checkOverflow = () => {
      // check the node itself
      if (node.scrollWidth > node.clientWidth) {
        return true
      }

      // check all children
      const children = node.querySelectorAll('*')
      for (const child of children) {
        if (child.scrollWidth > child.clientWidth) {
          return true
        }
      }

      return false
    }

    const overflow = checkOverflow()
    setHasOverflow(overflow)
  }, [tooltip?.tooltip])

  const getTooltipPos = (target, ref, position) => {
    if (!target || !ref.current) return
    const tooltipRect = ref.current?.getBoundingClientRect()
    const tooltipWidth = tooltipRect.width
    const tooltipHeight = tooltipRect.height

    // set tooltip left position
    const tooltipLeft = target.x - tooltipWidth / 2
    // set tooltip top position based on position parameter
    let tooltipTop
    if (position === 'bottom') {
      tooltipTop = target.y + 25
    } else {
      tooltipTop = target.y - tooltipHeight
    }

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
  const defaultDelay = 900
  const [delay, setDelay] = useState(defaultDelay)

  // when tooltip changes, update tooltip position using target position
  useEffect(() => {
    if (!tooltip) {
      // if tooltipPos is set, reset it
      if (timeoutId && !tooltip) {
        clearTimeout(timeoutId)
      }
      return
    }

    const id = getTooltipId(tooltip?.tooltip, tooltip?.shortcut, tooltip?.id)

    // new tooltip is set, but it's ref hasn't updated yet
    if (id !== tooltipRef.current?.id) return

    const newTooltipPos = getTooltipPos(tooltip?.target, tooltipRef, tooltip?.position)

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
      setTimeoutId(
        setTimeout(() => {
          setIsActive(true)
          setTooltip((t) => ({ ...t, pos: newTooltipPos, hide: false }))
        }, delay),
      )
    }
  }, [tooltip, setTooltip, delay])

  // once tooltip has been null for 300ms, set noTimeOut to false
  const [activeTimeoutId, setActiveTimeoutId] = useState(null)
  useEffect(() => {
    if (!tooltip && isActive) {
      setActiveTimeoutId(setTimeout(() => setIsActive(false), 200))
    } else
      return () => {
        if (activeTimeoutId) clearTimeout(activeTimeoutId)
      }
  }, [tooltip, isActive])

  const handleMouse = useCallback(
    (e) => {
      const target = e.target.closest('[data-tooltip], [data-shortcut]')

      // if we are hovering over the tooltip, don't do anything
      if (e.target?.closest('.tooltip')) return

      if (!target) {
        setTooltip(null)
        // clear timeout if one
        if (timeoutId) clearTimeout(timeoutId)

        return
      }

      const tooltipData = target?.dataset?.tooltip
      const shortcutData = target?.dataset?.shortcut
      const delayData = target?.dataset?.tooltipDelay
      const tooltipPosition = target?.dataset?.tooltipPosition
      // what to render as tooltip (pre, div, markdown, etc.)
      const asData = target?.dataset?.tooltipAs
      // check if data-tooltip attribute exists
      if (!tooltipData && !shortcutData) {
        setTooltip(null)
        return
      }

      const id = getTooltipId(tooltipData, shortcutData, target.id)

      // don't rerender if tooltip is already set to same value
      if (tooltip?.id === id) return

      // find center top position of target element
      const targetRect = target.getBoundingClientRect()

      let targetCenter
      // target top will also be tooltip bottom
      let targetTop = targetRect.top

      if (tooltipPosition === 'mouse') {
        // used in settings editor. Align horizontally with mouse,
        // because field is wide and centering causes tooltip to be
        // positioned weirdly
        targetCenter = e.clientX
      }
      else {
       // target center will also be tooltip left
       targetCenter = targetRect.left + targetRect.width / 2
      }

      // can the user click the tooltip
      const clickableData = target?.dataset?.tooltipClickable
      let clickable = clickableData === 'true'
      // if markdown and clickable is not set, set clickable to true
      if (asData === 'markdown' && (clickableData === undefined || clickable === true))
        clickable = true

      const newTargetPos = { x: targetCenter, y: targetTop }
      const newTooltip = {
        tooltip: tooltipData ?? '',
        shortcut: shortcutData ?? '',
        target: newTargetPos,
        id,
        hide: false,
        as: asData || 'div',
        clickable: clickable,
        position: tooltipPosition,
      }

      // check if tooltip is already set to same value
      if (isEqual(tooltip, newTooltip) && isEqual(tooltip?.target, newTargetPos)) return

      if (delayData) {
        const parsedDelay = parseInt(delayData)
        if (!isNaN(parsedDelay) && parsedDelay !== defaultDelay) {
          setDelay(parsedDelay)
        } else {
          setDelay(defaultDelay) // replace defaultDelay with your default value
        }
      } else if (delay !== defaultDelay) {
        setDelay(defaultDelay) // replace defaultDelay with your default value
      }

      setTooltip(newTooltip)
    },
    [setTooltip, tooltip, isActive, delay],
  )

  const hideTooltip = !tooltip?.pos || tooltip?.hide

  const tooltipComponent = useMemo(
    () => (
      <Styled.TooltipWidget
        ref={tooltipRef}
        id={getTooltipId(tooltip?.tooltip, tooltip?.shortcut, tooltip?.id)}
        className={tooltip?.tooltip ? 'tooltip' : 'tooltip hidden'}
        style={{
          display: tooltip ? 'flex' : 'none',
          visibility: hideTooltip ? 'hidden' : 'visible',
          opacity: hideTooltip ? 0 : 1,
          left: tooltip?.pos?.x || 0,
          top: tooltip?.pos?.y || 0,
          pointerEvents: tooltip?.clickable ? 'auto' : 'none',
        }}
        $targetPos={tooltip?.target}
      >
        <Styled.TooltipInner
          ref={tooltipInnerRef}
          as={tooltip?.as === 'markdown' ? 'div' : tooltip?.as}
          $hasOverflow={hasOverflow}
        >
          {tooltip?.as === 'markdown' ? (
            <ReactMarkdown rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }]]}>
              {tooltip?.tooltip}
            </ReactMarkdown>
          ) : (
            tooltip?.tooltip
          )}

          {tooltip?.shortcut && <ShortcutTag>{tooltip?.shortcut}</ShortcutTag>}
        </Styled.TooltipInner>
      </Styled.TooltipWidget>
    ),
    [tooltip, hideTooltip, hasOverflow, tooltipInnerRef],
  )

  return [handleMouse, tooltipComponent]
}

export default useTooltip

import { Section } from '@ynput/ayon-react-components'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import KanBanColumn from './KanBanColumn/KanBanColumn'
import { useDndContext } from '@dnd-kit/core'
import styled from 'styled-components'
import CollapsedColumn from './KanBanColumn/CollapsedColumn'
import MenuContainer from '/src/components/Menu/MenuComponents/MenuContainer'
import ColumnMenu from './KanBanColumn/ColumnMenu'

const StyledWrapper = styled(Section)`
  height: 100%;
  width: 100%;
  align-items: flex-start;
  justify-content: flex-start;
  overflow-x: auto;
  padding: 0 8px;
`

const ColumnsWrapper = ({
  fieldsColumns,
  tasksColumns,
  groupByValue,
  isLoading,
  allUsers = [],
  disabledStatuses = [],
  onCollapsedColumnsChange,
}) => {
  const { active } = useDndContext()
  const sectionRef = useRef(null)
  const columnsRefs = useRef({})

  const openColumnIds = useMemo(
    () => fieldsColumns.flatMap((c) => (!c?.isCollapsed ? c[0].id : [])),
    [fieldsColumns],
  )

  const [scrollDirection, setScrollDirection] = useState(null)

  // we get section rect to figure out how high to make droppable area
  const [sectionRect, setSectionRect] = useState(null)

  useEffect(() => {
    if (!sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    setSectionRect(rect)
  }, [sectionRef.current])

  // this scrolls the section based on the direction
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const speed = 10

    let intervalId = null

    if (scrollDirection) {
      intervalId = setInterval(() => {
        el.scrollLeft += speed * scrollDirection
      }, 5)
    }

    return () => {
      clearInterval(intervalId)
    }
  }, [scrollDirection, sectionRef.current])

  // if we are dragging, detect if we are near the edge of the section
  useEffect(() => {
    const handleMouseMove = (event) => {
      const el = sectionRef.current
      if (!active || !el) {
        setScrollDirection(null)
        return
      }
      const isOverflowing = el.scrollWidth > el.clientWidth
      if (!isOverflowing) {
        setScrollDirection(null)
        return
      }

      // get bounding box of the section
      const { left, right } = el.getBoundingClientRect()
      // xPos of the mouse
      const xPos = event.clientX
      const threshold = 100

      const newScrollDirection = xPos < left + threshold ? -1 : xPos > right - threshold ? 1 : null

      if (newScrollDirection === null) {
        // console.log('setting null')
        setScrollDirection(null)
      } else if (newScrollDirection !== scrollDirection) {
        // console.log('setting new', newScrollDirection)
        setScrollDirection(newScrollDirection)
      }
    }

    if (active) {
      window.addEventListener('mousemove', handleMouseMove)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      setScrollDirection(null)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      setScrollDirection(null)
    }
  }, [active, sectionRef.current])

  return (
    <>
      <StyledWrapper
        style={{
          cursor: active && 'grabbing',
        }}
        direction="row"
        ref={sectionRef}
      >
        {fieldsColumns.flatMap((columnsArray = [], i) => {
          const isCollapsed = columnsArray.some((c) => c.isCollapsed)

          // return collapsed column if collapsed
          if (isCollapsed)
            return (
              <CollapsedColumn columns={columnsArray} onChange={onCollapsedColumnsChange} key={i} />
            )

          // for now this should only ever been one item
          // in the future we may want to allow multiple columns to be grouped into one column
          return columnsArray.flatMap(({ id }) => {
            const column = tasksColumns[id]
            if (!column) return []
            return (
              <KanBanColumn
                key={id}
                columns={tasksColumns}
                tasks={column.tasks}
                isLoading={isLoading}
                id={id}
                groupByValue={groupByValue}
                allUsers={allUsers}
                sectionRect={sectionRect}
                sectionRef={sectionRef}
                disabled={disabledStatuses.includes(column.name)}
                onToggleCollapse={() => onCollapsedColumnsChange(id)}
                ref={(el) => {
                  columnsRefs.current[id] = el
                }}
              />
            )
          })
        })}
      </StyledWrapper>
      {/* Dropdown menu */}
      {openColumnIds.map((id) => {
        // get button ref
        const columnEl = columnsRefs.current[id]
        if (!columnEl) return null
        // get more button el
        const buttonRef = columnEl.querySelector('.column-menu')
        if (!buttonRef) return null

        return (
          <MenuContainer id={id} key={id} target={buttonRef}>
            <ColumnMenu onCollapse={() => onCollapsedColumnsChange(id)} />
          </MenuContainer>
        )
      })}
    </>
  )
}

export default ColumnsWrapper

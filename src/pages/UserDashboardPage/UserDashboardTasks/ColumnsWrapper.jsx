import { Section } from '@ynput/ayon-react-components'
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import KanBanColumn from './KanBanColumn/KanBanColumn'
import { useDndContext } from '@dnd-kit/core'
import styled from 'styled-components'
import CollapsedColumn from './KanBanColumn/CollapsedColumn'

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
  projectsInfo,
}) => {
  const { active } = useDndContext()
  const sectionRef = useRef(null)
  const columnsRefs = useRef({})

  // find out which column the active card has come from
  const activeColumn = useMemo(() => {
    return Object.values(tasksColumns).find((column) =>
      column.tasks.find((t) => t.id === active?.id),
    )
  }, [tasksColumns, active])

  // const [scrollDirection, setScrollDirection] = useState(null)
  const scrollDirection = useRef(null)

  // we get section rect to figure out how high to make droppable area
  const [sectionRect, setSectionRect] = useState(null)

  useLayoutEffect(() => {
    if (!sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    setSectionRect(rect)
  }, [sectionRef.current])

  // this scrolls the section based on the direction
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const speed = 13

    let intervalId = null

    if (scrollDirection.current) {
      intervalId = setInterval(() => {
        el.scrollLeft += speed * scrollDirection.current
      }, 5)
    }

    return () => {
      clearInterval(intervalId)
    }
  }, [scrollDirection.current, sectionRef.current])

  // if we are dragging, detect if we are near the edge of the section
  useEffect(() => {
    const handleMouseMove = (event) => {
      const el = sectionRef.current
      if (!active || !el) {
        scrollDirection.current = null
        return
      }
      const isOverflowing = el.scrollWidth > el.clientWidth
      if (!isOverflowing) {
        scrollDirection.current = null
        return
      }

      // get bounding box of the section
      const { left, right } = el.getBoundingClientRect()
      // xPos of the mouse
      const xPos = event.clientX
      const threshold = 120

      const newScrollDirection = xPos < left + threshold ? -1 : xPos > right - threshold ? 1 : null

      if (newScrollDirection === null) {
        // console.log('setting null')
        scrollDirection.current = null
      } else if (newScrollDirection !== scrollDirection) {
        // console.log('setting new', newScrollDirection)
        scrollDirection.current = newScrollDirection
      }
    }

    if (active) {
      window.addEventListener('mousemove', handleMouseMove)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      scrollDirection.current = null
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      scrollDirection.current = null
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
        {fieldsColumns.flatMap((column) => {
          const { id, isCollapsed, items, collapsed } = column
          // return collapsed column if collapsed
          if (isCollapsed)
            return (
              <CollapsedColumn columns={collapsed} onChange={onCollapsedColumnsChange} key={id} />
            )

          // get all tasks for this column from items
          const tasks = items.flatMap((item) => {
            const column = tasksColumns[item.id]
            if (!column) return []
            return column.tasks
          })

          return (
            <KanBanColumn
              key={id}
              column={column}
              tasks={tasks}
              groupItems={items}
              isLoading={isLoading}
              id={id}
              groupByValue={groupByValue}
              allUsers={allUsers}
              sectionRect={sectionRect}
              sectionRef={sectionRef}
              disabledStatuses={disabledStatuses}
              onToggleCollapse={() => onCollapsedColumnsChange(id)}
              ref={(el) => {
                columnsRefs.current[id] = el
              }}
              active={active}
              activeColumn={activeColumn}
              projectsInfo={projectsInfo}
            />
          )
        })}
      </StyledWrapper>
    </>
  )
}

export default ColumnsWrapper

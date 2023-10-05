import {
  Button,
  InputText,
  SaveButton,
  Section,
  Spacer,
  Toolbar,
} from '@ynput/ayon-react-components'
import React, { useEffect, useRef, useState } from 'react'
import KanBanColumn from './KanBanColumn/KanBanColumn'
import { useDndContext } from '@dnd-kit/core'
import styled from 'styled-components'
import CollapsedColumn from './KanBanColumn/CollapsedColumn'
import MenuContainer from '/src/components/Menu/MenuComponents/MenuContainer'
import ColumnMenu from './KanBanColumn/ColumnMenu'
import { Dialog } from 'primereact/dialog'
import confirmDelete from '/src/helpers/confirmDelete'
import { snakeCase } from 'lodash'

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
  onGroupChange,
  onGroupDelete,
  onGroupRename,
}) => {
  const { active } = useDndContext()
  const sectionRef = useRef(null)
  const columnsRefs = useRef({})

  // find out which column the active card has come from
  const activeColumn = Object.values(tasksColumns).find((column) =>
    column.tasks.find((t) => t.id === active?.id),
  )

  const [scrollDirection, setScrollDirection] = useState(null)

  const [groupRename, setGroupRename] = useState({ id: null, value: '' })
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

    const speed = 13

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
      const threshold = 120

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
            />
          )
        })}
      </StyledWrapper>
      {/* Dropdown menu */}
      {fieldsColumns.map(({ id, name, items = [], isCustom, color }, index) => {
        // get button ref
        const columnEl = columnsRefs.current[id]
        if (!columnEl) return null
        // get more button el
        const buttonRef = columnEl.querySelector('.column-menu')
        if (!buttonRef) return null

        // all columns except ones in items
        const otherColumns = Object.values(tasksColumns).filter(
          (c) => !items.some((i) => i.id === c.id),
        )

        return (
          <MenuContainer id={id} key={id} target={buttonRef}>
            <ColumnMenu
              otherColumns={otherColumns}
              currentColumns={items}
              onCollapse={() => onCollapsedColumnsChange(id)}
              onAdd={(_, { id: c, index: ci }) =>
                onGroupChange({ id, index, name }, { id: c, index: ci })
              }
              onCreate={() => {
                onGroupChange({ id, index, name, color }, {})
                setGroupRename({ id: `${id}_group`, value: '' })
              }}
              onRemove={(_, { id: c }) => onGroupChange({ id }, {}, c)}
              onRename={() => setGroupRename({ id, value: '' })}
              onDelete={() =>
                confirmDelete({
                  label: 'Column Group',
                  message:
                    'Are you sure you want to delete this group? All columns will be split out.',
                  accept: () => onGroupDelete(id),
                })
              }
              isCustom={isCustom}
            />
          </MenuContainer>
        )
      })}
      {/* rename dialog */}
      <Dialog
        visible={groupRename?.id}
        header="Rename group"
        onHide={() => setGroupRename({ id: null, value: '' })}
        footer={
          <Toolbar>
            <Spacer />
            <Button label="Cancel" onClick={() => setGroupRename({ id: null, value: '' })} />
            <SaveButton
              label="Rename"
              onClick={() => {
                onGroupRename(groupRename.id, groupRename.value)
                setGroupRename({ id: null, value: '' })
              }}
              active={
                groupRename?.value &&
                fieldsColumns.every(({ id }) => id !== snakeCase(groupRename?.value))
              }
            />
          </Toolbar>
        }
      >
        <InputText
          value={groupRename?.value}
          onChange={(e) => setGroupRename({ id: groupRename?.id, value: e.target.value })}
          style={{ width: 200 }}
        />
      </Dialog>
    </>
  )
}

export default ColumnsWrapper

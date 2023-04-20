import { useMemo } from 'react'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useEffect } from 'react'

const TeamList = ({
  teams,
  isLoading,
  selection,
  onSelect,
  onRowClick,
  showNull,
  multiselect,
  footer,
  style,
  styleSection,
  className,
  onNoProject,
  onSuccess,
  autoSelect,
}) => {
  // if selection does not exist in data, set selection to null
  useEffect(() => {
    if (isLoading) return

    if (onNoProject && !teams.map((project) => project.name).includes(selection)) {
      console.log('selected project does not exist: ', selection)
      const defaultProject = autoSelect ? teams[0]?.name : null
      onNoProject(defaultProject)
    } else if (onSuccess) onSuccess()
  }, [selection, teams, onNoProject, isLoading])

  const projectList = [...teams]

  if (showNull) projectList.unshift({ name: '_' })

  const selectionObj = useMemo(() => {
    if (multiselect) {
      let result = []
      for (const project of projectList) {
        if (selection === null) {
          if (project.name === '_') {
            result.push(project)
            break
          }
        }
        if (selection?.includes(project.name)) result.push(project)
      }
      return result
    } else {
      for (const project of projectList) {
        if (project.name === selection) return project
        if (!selection && project.name === '_') return project
      }
    } // single select
  }, [selection, projectList])

  const onSelectionChange = (e) => {
    if (multiselect) {
      let result = []
      for (const node of e.value) {
        if (node.name === '_') {
          result = null
          break
        }
        result.push(node.name)
      }
      onSelect(result)
    } // multiselect
    else {
      if (e.value.name === '_') onSelect(null)
      else onSelect(e.value.name)
    } // single select
  } // onSelectionChange

  return (
    <Section style={{ maxWidth: 200, ...styleSection }} className={className}>
      {footer}
      <TablePanel loading={isLoading}>
        <DataTable
          value={projectList}
          scrollable="true"
          scrollHeight="flex"
          selectionMode={multiselect ? 'multiple' : 'single'}
          responsive="true"
          dataKey="name"
          selection={selectionObj}
          onSelectionChange={onSelect && onSelectionChange}
          onRowClick={onRowClick}
        >
          <Column field="name" header="Team" style={{ minWidth: 150, ...style }} />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default TeamList

import { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Section, TablePanel } from '@ynput/ayon-react-components'

import { $Any } from '@types'
import { useUpdateEditorMutation } from '@queries/editor/updateEditor'
import { useGetAttributeListQuery } from '@queries/attributes/getAttributes'
import { Splitter, SplitterPanel } from 'primereact/splitter'

import MyTable from './Table'
import useExtendedHierarchyTable from './useExtendedHierarchyTable'

const NewEditorPage = () => {
  const project = useSelector((state: $Any) => state.project)

  const projectName = useSelector((state: $Any) => state.project.name)

  // get nodes for tree from redux state
  const rootDataCache = useSelector((state: $Any) => state.editor.nodes)

  // used to update nodes
  const [{ isLoading: isUpdating }] = useUpdateEditorMutation()

  // @ts-ignore
  let { data: attribsData = [] } = useGetAttributeListQuery({}, { refetchOnMountOrArgChange: true })

  //   filter out scopes
  const attribFields = attribsData.filter((a: $Any) =>
    a.scope.some((s: $Any) => ['folder', 'task'].includes(s)),
  )

  const {
    data,
    setExpandedItem,
    expanded,
    setExpanded
  } = useExtendedHierarchyTable({
    projectName,
    folderTypes: project.folders || {},
    taskTypes: project.tasks || {},
  })

  const handleToggleFolder = useCallback(
    async (event: $Any, folderId: string) => {
      setExpandedItem(folderId)
    },
    [rootDataCache],
  )

  return (
    <main className="editor-page">
      <Section>
        <Splitter
          style={{ width: '100%', height: '100%' }}
          layout="horizontal"
          stateKey="editor-panels"
          stateStorage="local"
        >
          <SplitterPanel size={100}>
            <TablePanel loading={isUpdating} style={{ height: '100%' }}>
              <MyTable
                attribs={attribFields}
                rootData={rootDataCache}
                tableData={data}
                expanded={expanded}
                setExpanded={setExpanded}
                toggleExpanderHandler={handleToggleFolder}
                isLoading={false}
                isExpandable={false}
                sliceId={''}
              />
            </TablePanel>
          </SplitterPanel>
        </Splitter>
      </Section>
    </main>
  )
}

export default NewEditorPage

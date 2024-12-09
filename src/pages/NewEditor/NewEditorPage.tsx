import { useEffect, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Section, TablePanel } from '@ynput/ayon-react-components'

import { $Any } from '@types'
import { useLazyGetExpandedBranchQuery } from '@queries/editor/getEditor'
import { useUpdateEditorMutation } from '@queries/editor/updateEditor'
import { useGetAttributeListQuery } from '@queries/attributes/getAttributes'
import { Splitter, SplitterPanel } from 'primereact/splitter'

import MyTable from './Table'
import useExtendedHierarchyTable from './useExtendedHierarchyTable'

const NewEditorPage = () => {
  const project = useSelector((state: $Any) => state.project)
  const dispatch = useDispatch()

  const projectName = useSelector((state: $Any) => state.project.name)

  // get nodes for tree from redux state
  const rootDataCache = useSelector((state: $Any) => state.editor.nodes)

  // used to update nodes
  const [{ isLoading: isUpdating }] = useUpdateEditorMutation()

  const [_, setLoadingBranches] = useState([])
  // use later on for loading new branches

  const [triggerGetExpandedBranch] = useLazyGetExpandedBranchQuery()

  // @ts-ignore
  let { data: attribsData = [] } = useGetAttributeListQuery({}, { refetchOnMountOrArgChange: true })

  // call loadNewBranches with an array of folder ids to get the branches and patch them into the rootData cache
  const loadNewBranches = async (folderIds: $Any) => {
    if (!folderIds.length) return

    try {
      setLoadingBranches(folderIds)
      for (const id of folderIds) {
        await triggerGetExpandedBranch({
          projectName,
          parentId: id,
        })
      }
      // reset after loading
      setLoadingBranches([])
    } catch (error) {
      console.error(error)
    }
  }

  //   filter out scopes
  const attribFields = attribsData.filter((a: $Any) =>
    a.scope.some((s: $Any) => ['folder', 'task'].includes(s)),
  )

  // on mount only load root
  // and any other expanded folders
  useEffect(() => {
    let branches = ['root']
    loadNewBranches(branches)
  }, [projectName])

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
    [rootDataCache, loadNewBranches, dispatch],
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

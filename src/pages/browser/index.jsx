import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Section } from 'openpype-components'
import { useSelector } from 'react-redux'

import Hierarchy from '/src/containers/hierarchy'
import TaskList from '/src/containers/taskList'

import Subsets from './subsets'
import Detail from './detail'
import TagsEditorContainer from '/src/containers/tagsEditor'

const BrowserPage = () => {
  const context = useSelector((state) => ({ ...state.context }))
  // check if tags dialog is open
  const dialogType = context.dialog.type
  const projectName = context.projectName
  // get all tags for project
  const projectTags = context.project.tags
  const focusedType = context.focused.type
  let focusedIds = []
  if (focusedType) {
    focusedIds = context.focused[`${focusedType}s`]
  }

  return (
    <main>
      <Splitter layout="horizontal" style={{ width: '100%', height: '100%' }}>
        <SplitterPanel size={18} style={{ minWidth: 250, maxWidth: 600 }}>
          <Section className="wrap">
            <Hierarchy />
            <TaskList style={{ maxHeight: 300 }} />
          </Section>
        </SplitterPanel>

        <SplitterPanel size={82}>
          <Splitter layout="horizontal" style={{ height: '100%' }}>
            <SplitterPanel style={{ minWidth: 500 }}>
              <Subsets />
            </SplitterPanel>
            <SplitterPanel style={{ minWidth: 250, maxWidth: 480 }}>
              <Detail />
            </SplitterPanel>
          </Splitter>
        </SplitterPanel>
      </Splitter>
      {dialogType === 'tags' && !!focusedIds?.length && (
        <TagsEditorContainer
          ids={focusedIds}
          type={focusedType}
          {...{ projectName, projectTags }}
        />
      )}
    </main>
  )
}

export default BrowserPage

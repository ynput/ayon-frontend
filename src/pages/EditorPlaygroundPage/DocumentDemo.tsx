import { useRef, useState } from 'react'
import clsx from 'clsx'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TreeView } from '@lexical/react/LexicalTreeView'
import { Button, SaveButton } from '@ynput/ayon-react-components'
import { MarkdownEditor, type MarkdownEditorHandle } from '@shared/components/MarkdownEditor'
import CommentMarkdown from './CommentMarkdown'
import { useMockMentions } from './useMockMentions'
import { SAMPLES } from './samples'
import * as Styled from './EditorPlaygroundPage.styled'

type Tab = 'markdown' | 'preview' | 'tree' | 'events'

const TreeViewPlugin = () => {
  const [editor] = useLexicalComposerContext()
  return <TreeView editor={editor} viewClassName="tree-view" />
}

// Description / article editor: toolbar at the top, markdown output and preview next to it
const DocumentDemo = () => {
  const editorRef = useRef<MarkdownEditorHandle>(null)
  const [markdown, setMarkdown] = useState(SAMPLES[0].markdown)
  const [source, setSource] = useState(SAMPLES[0].markdown)
  const [tab, setTab] = useState<Tab>('preview')
  const [showToolbar, setShowToolbar] = useState(true)
  const [readOnly, setReadOnly] = useState(false)
  const [isFolder, setIsFolder] = useState(false)
  const [spacedPreview, setSpacedPreview] = useState(true)
  // remount the editor to test the initial value import
  const [editorKey, setEditorKey] = useState(0)
  const [events, setEvents] = useState<string[]>([])

  const log = (message: string) =>
    setEvents((prev) => [`${new Date().toLocaleTimeString()}  ${message}`, ...prev].slice(0, 100))

  const mentions = useMockMentions(isFolder)

  const loadMarkdown = (value: string) => {
    setSource(value)
    setMarkdown(value)
    setEditorKey((k) => k + 1)
  }

  const handleSubmit = () => {
    log(`submit: ${JSON.stringify(editorRef.current?.getMarkdown())}`)
    setMarkdown('')
  }

  return (
    <>
      <Styled.Header>
        <Styled.Group>
          {SAMPLES.map((sample) => (
            <Button key={sample.id} onClick={() => loadMarkdown(sample.markdown)}>
              {sample.label}
            </Button>
          ))}
        </Styled.Group>
        <Styled.Group>
          <Styled.Toggle>
            <input
              type="checkbox"
              checked={showToolbar}
              onChange={(e) => setShowToolbar(e.target.checked)}
            />
            Toolbar
          </Styled.Toggle>
          <Styled.Toggle>
            <input
              type="checkbox"
              checked={readOnly}
              onChange={(e) => {
                setReadOnly(e.target.checked)
                setEditorKey((k) => k + 1)
              }}
            />
            Read only
          </Styled.Toggle>
          <Styled.Toggle>
            <input
              type="checkbox"
              checked={isFolder}
              onChange={(e) => setIsFolder(e.target.checked)}
            />
            Folder entity
          </Styled.Toggle>
        </Styled.Group>
      </Styled.Header>

      <Styled.Columns>
        <Styled.Column>
          <Styled.ColumnTitle>Editor</Styled.ColumnTitle>
          <MarkdownEditor
            key={editorKey}
            ref={editorRef}
            variant="document"
            value={markdown}
            onChange={setMarkdown}
            placeholder="Comment, or type / to add mentions, checklists, code and more..."
            mentions={mentions}
            toolbar={showToolbar}
            readOnly={readOnly}
            maxHeight={500}
            onSubmit={handleSubmit}
            onEscape={() => log('escape')}
            onFiles={(files) => log(`files: ${files.map((f) => f.name).join(', ')}`)}
            onMentionClick={(m) => log(`mention click: ${m.type}:${m.id} (${m.label})`)}
            onMentionHover={(m) => log(`mention hover: ${m.type}:${m.id}`)}
            footer={
              <Styled.Footer>
                <Styled.Group>
                  <Button
                    icon="person"
                    variant="text"
                    data-tooltip="Mention user"
                    data-shortcut="@"
                    onClick={() => editorRef.current?.insertMentionTrigger('@')}
                  />
                  <Button
                    icon="layers"
                    variant="text"
                    data-tooltip="Mention version"
                    data-shortcut="@@"
                    onClick={() => editorRef.current?.insertMentionTrigger('@@')}
                  />
                  <Button
                    icon="check_circle"
                    variant="text"
                    data-tooltip="Mention task"
                    data-shortcut="@@@"
                    onClick={() => editorRef.current?.insertMentionTrigger('@@@')}
                  />
                </Styled.Group>
                <SaveButton
                  label="Comment"
                  active={!!markdown}
                  onClick={handleSubmit}
                  data-shortcut="⌘+Enter"
                />
              </Styled.Footer>
            }
          >
            {tab === 'tree' && <TreeViewPlugin />}
          </MarkdownEditor>

          <Styled.ColumnTitle>
            Markdown source
            <Button variant="text" icon="upload" onClick={() => loadMarkdown(source)}>
              Load into editor
            </Button>
          </Styled.ColumnTitle>
          <Styled.Source
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
          />
        </Styled.Column>

        <Styled.Column>
          <Styled.Tabs>
            {(['preview', 'markdown', 'tree', 'events'] as Tab[]).map((t) => (
              <Button
                key={t}
                variant={tab === t ? 'filled' : 'text'}
                onClick={() => setTab(t)}
                className={clsx({ active: tab === t })}
              >
                {t}
              </Button>
            ))}
            {tab === 'preview' && (
              <Styled.Toggle style={{ marginLeft: 'auto' }}>
                <input
                  type="checkbox"
                  checked={spacedPreview}
                  onChange={(e) => setSpacedPreview(e.target.checked)}
                />
                GitHub paragraph spacing
              </Styled.Toggle>
            )}
          </Styled.Tabs>

          {tab === 'preview' && (
            <CommentMarkdown
              markdown={markdown}
              spaced={spacedPreview}
              onReferenceClick={(ref) =>
                log(`preview reference click: ${ref.entityType}:${ref.entityId}`)
              }
            />
          )}
          {tab === 'markdown' && <Styled.Output>{markdown || ' '}</Styled.Output>}
          {tab === 'tree' && (
            <Styled.TreeHint>The node tree renders below the editor.</Styled.TreeHint>
          )}
          {tab === 'events' && (
            <Styled.Output>{events.length ? events.join('\n') : 'No events yet'}</Styled.Output>
          )}
        </Styled.Column>
      </Styled.Columns>
    </>
  )
}

export default DocumentDemo

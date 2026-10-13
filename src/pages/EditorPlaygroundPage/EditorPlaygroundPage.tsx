import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@ynput/ayon-react-components'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import DocumentDemo from './DocumentDemo'
import MessagesDemo from './MessagesDemo'
import * as Styled from './EditorPlaygroundPage.styled'

const DEMOS = {
  document: { label: 'Document', icon: 'description', component: DocumentDemo },
  messages: { label: 'Messages', icon: 'forum', component: MessagesDemo },
} as const
type Demo = keyof typeof DEMOS

/**
 * Dev page to try the lexical MarkdownEditor: /dev/editor
 * - document: description / article editor with markdown output, comment preview and node tree
 * - messages: chat style feed with the message input at the bottom
 */
const EditorPlaygroundPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initial = searchParams.get('demo') as Demo | null
  const [demo, setDemo] = useState<Demo>(initial && initial in DEMOS ? initial : 'document')
  const DemoComponent = DEMOS[demo].component

  const selectDemo = (next: Demo) => {
    setDemo(next)
    setSearchParams({ demo: next }, { replace: true })
  }

  return (
    <main style={{ overflow: 'hidden' }}>
      <DocumentTitle title="Editor playground • AYON" />
      <Styled.Page>
        <Styled.Header>
          <h2>Markdown editor playground</h2>
          <Styled.Group>
            {(Object.keys(DEMOS) as Demo[]).map((key) => (
              <Button
                key={key}
                icon={DEMOS[key].icon}
                variant={demo === key ? 'filled' : 'surface'}
                onClick={() => selectDemo(key)}
              >
                {DEMOS[key].label}
              </Button>
            ))}
          </Styled.Group>
        </Styled.Header>
        <DemoComponent />
      </Styled.Page>
    </main>
  )
}

export default EditorPlaygroundPage

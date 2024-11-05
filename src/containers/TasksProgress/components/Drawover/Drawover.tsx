import { useState } from 'react'
import { createPortal } from 'react-dom'
import * as Styled from './Drawover.styled'
import { DefaultColorStyle, Editor, GeoShapeGeoStyle, Tldraw, useValue } from 'tldraw'
import 'tldraw/tldraw.css'
import clsx from 'clsx'
import useSaveAnnotation from './hooks/useSaveAnnotation'
import useFramePageSync from './hooks/useFramePageSync'
import usePlayingState from './hooks/usePlayingState'
import useInitialEditorLoad from './hooks/useInitialEditorLoad'

type Props = {
  range: [number, number]
  durationFrames: number
  isPlaying: boolean
  videoRef: HTMLVideoElement | null
}

const Drawover = ({ range, durationFrames, isPlaying, videoRef }: Props) => {
  const [isOpen, setIsOpen] = useState<null | { id: string; value?: string }>(null)
  const [editor, setEditor] = useState<Editor | null>(null)

  // when frame updates, set the page to the new frame
  useFramePageSync({ editor, range, durationFrames })

  // disabled editor when playing video
  usePlayingState({ editor, isPlaying })

  const currentToolId = useValue('select', () => editor?.getCurrentToolId(), [editor])
  const currentGeoShape = useValue('oval', () => editor?.getStyleForNextShape(GeoShapeGeoStyle), [
    editor,
  ])
  const currentColor = useValue('black', () => editor?.getStyleForNextShape(DefaultColorStyle), [
    editor,
  ])

  const handleToolClick = ({ id, value }: { id: string; value?: string }) => {
    // first open the drawover if not already open
    if (!isOpen) {
      setIsOpen({ id, value })
    }

    switch (id) {
      case 'select':
        editor?.setCurrentTool('select')
        break
      case 'draw':
        editor?.setCurrentTool('draw')
        break
      case 'geo':
        if (!editor || !value) return
        editor?.run(() => {
          editor.setStyleForNextShapes(GeoShapeGeoStyle, value)
          editor.setCurrentTool('geo')
        })

        break
      case 'color':
        if (!editor || !value) return
        editor?.run(() => {
          editor.setStyleForSelectedShapes(DefaultColorStyle, value as any)
          editor.setStyleForNextShapes(DefaultColorStyle, value)
        })

        break
      default:
        break
    }
  }

  // set initial tool
  useInitialEditorLoad({ editor, isOpen, handleToolClick })

  useSaveAnnotation({ editor, videoRef, range })

  const toolbarPortalEl = document.getElementById('view-annotation-tools')

  return (
    <Styled.Wrapper style={{ position: 'absolute', inset: 0, opacity: editor ? 1 : 0 }}>
      {isOpen && (
        <Tldraw
          onMount={(editor) => {
            setEditor(editor)
          }}
          cameraOptions={{
            isLocked: true,
          }}
          options={{
            maxPages: durationFrames,
          }}
          components={{
            Toolbar: null,
            ActionsMenu: null,
            Background: null,
            ContextMenu: null,
            MenuPanel: null,
            ZoomMenu: null,
            Minimap: null,
            LoadingScreen: null,
          }}
        />
      )}
      {toolbarPortalEl &&
        createPortal(
          <Styled.Toolbar>
            <Styled.ToolsSection>
              <Styled.ToolButton
                icon="arrow_selector_tool"
                onClick={() => handleToolClick({ id: 'select' })}
                className={clsx({ selected: currentToolId === 'select' })}
              />
              <Styled.ToolButton
                icon="draw"
                onClick={() => handleToolClick({ id: 'draw' })}
                className={clsx({ selected: currentToolId === 'draw' })}
              />
              <Styled.ToolButton
                icon="circle"
                onClick={() => handleToolClick({ id: 'geo', value: 'oval' })}
                className={clsx({
                  selected: currentToolId === 'geo' && currentGeoShape === 'oval',
                })}
              />
              <Styled.ToolButton
                icon="line_end_arrow"
                onClick={() => handleToolClick({ id: 'geo', value: 'arrow-up' })}
                className={clsx({
                  selected: currentToolId === 'geo' && currentGeoShape === 'arrow-up',
                })}
              />
            </Styled.ToolsSection>
            <Styled.Divider />
            <Styled.ToolsSection>
              <Styled.ToolButton
                onClick={() => handleToolClick({ id: 'color', value: 'red' })}
                className={clsx('color', {
                  selected: currentColor === 'red',
                })}
              >
                <Styled.Color style={{ backgroundColor: 'red' }} />
              </Styled.ToolButton>
            </Styled.ToolsSection>
            <Styled.Divider />
            <Styled.ToolsSection>
              <Styled.ToolButton icon="undo" onClick={() => editor?.undo()} />
              <Styled.ToolButton icon="redo" onClick={() => editor?.redo()} />
            </Styled.ToolsSection>
          </Styled.Toolbar>,
          toolbarPortalEl,
        )}
    </Styled.Wrapper>
  )
}

export default Drawover

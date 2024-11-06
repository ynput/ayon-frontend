import { MouseEvent, useState } from 'react'
import { createPortal } from 'react-dom'
import * as Styled from './Drawover.styled'
import {
  DefaultColorStyle,
  DefaultSizeStyle,
  Editor,
  GeoShapeGeoStyle,
  Tldraw,
  useValue,
} from 'tldraw'
import 'tldraw/tldraw.css'
import clsx from 'clsx'
import useSaveAnnotation from './hooks/useSaveAnnotation'
import useFramePageSync from './hooks/useFramePageSync'
import usePlayingState from './hooks/usePlayingState'
import useInitialEditorLoad from './hooks/useInitialEditorLoad'
import useRemoveAnnotation from './hooks/useRemoveAnnotation'
import { Slider } from 'primereact/slider'

type Props = {
  range: [number, number]
  durationFrames: number
  isPlaying: boolean
  videoRef: HTMLVideoElement | null
  name: string
}

type SliderState = {
  id: string
  pos: {
    y: number
  }
  value: number
  steps: number
  onChange: (e: any) => void
}

const sliders = {
  width: ['s', 'm', 'l', 'xl'],
  opacity: [0, 1, 2, 3, 4],
}

const presetColors = ['white', 'black', 'red', 'green']

const Drawover = ({ range, durationFrames, isPlaying, videoRef, name }: Props) => {
  const [isOpen, setIsOpen] = useState<null | { id: string; value?: string }>(null)
  const [editor, setEditor] = useState<Editor | null>(null)

  // when frame updates, set the page to the new frame
  useFramePageSync({ editor, range, durationFrames, isPlaying })

  // disabled editor when playing video
  usePlayingState({ editor, isPlaying })

  // remove annotations when removed in the comment input
  useRemoveAnnotation({ editor })

  const currentToolId = useValue('select', () => editor?.getCurrentToolId(), [editor])
  const currentGeoShape = useValue('oval', () => editor?.getStyleForNextShape(GeoShapeGeoStyle), [
    editor,
  ])
  const currentColor = useValue('black', () => editor?.getStyleForNextShape(DefaultColorStyle), [
    editor,
  ])

  const sliderValues = {
    width: useValue('m', () => editor?.getStyleForNextShape(DefaultSizeStyle), [editor]) || 'm',
  }

  const handleToolClick = ({ id, value }: { id: string; value?: string }) => {
    // first open the drawover if not already open
    if (!isOpen) {
      setIsOpen({ id, value })
    }

    if (!editor) return

    switch (id) {
      case 'select':
        editor.setCurrentTool('select')
        break
      case 'draw':
        editor.setCurrentTool('draw')
        break
      case 'geo':
        editor.run(() => {
          editor.setStyleForNextShapes(GeoShapeGeoStyle, value)
          editor.setCurrentTool('geo')
        })

        break
      case 'arrow':
        editor.run(() => {
          editor.setCurrentTool('arrow')
        })
        break
      case 'color':
        editor.run(() => {
          editor.setStyleForSelectedShapes(DefaultColorStyle, value as any)
          editor.setStyleForNextShapes(DefaultColorStyle, value)
        })
        break

      case 'size':
        editor.run(() => {
          editor.setStyleForSelectedShapes(DefaultSizeStyle, value as any)
          editor.setStyleForNextShapes(DefaultSizeStyle, value)
        })
        break
      default:
        break
    }
  }

  const [slider, setSlider] = useState<SliderState | null>(null)

  const handleSliderOpen = (e: MouseEvent<HTMLButtonElement>, id: keyof typeof sliders) => {
    const slider = sliders[id]
    const target = e.target as HTMLButtonElement
    if (!slider) return

    setSlider({
      id: id,
      pos: { y: target.offsetTop },
      value: sliderValues[id],
      steps: slider.length,
      onChange: (e) => {
        const sliderValue = e.value as number
        // based on value out of 100, find the index of the slider array
        const index = Math.floor((sliderValue / 100) * slider.length)
        const value = slider[index]

        if (!value) return

        editor?.run(() => {
          editor.setStyleForSelectedShapes(DefaultSizeStyle, value as any)
          editor.setStyleForNextShapes(DefaultSizeStyle, value as any)
        })
      },
    })
  }

  // set initial tool
  useInitialEditorLoad({ editor, isOpen, handleToolClick })

  useSaveAnnotation({ editor, videoRef, range, name })

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
                onClick={() => handleToolClick({ id: 'arrow' })}
                className={clsx({
                  selected: currentToolId === 'geo' && currentGeoShape === 'arrow-up',
                })}
              />
            </Styled.ToolsSection>
            <Styled.Divider />

            <Styled.ToolButton
              onClick={(e) => handleSliderOpen(e, 'width')}
              icon={`pen_size_${sliders.width.indexOf(sliderValues.width)}`}
              style={{ width: '100%' }}
            />

            <Styled.Divider />
            <Styled.ToolsSection>
              {presetColors.map((color) => (
                <Styled.ToolButton
                  key={color}
                  onClick={() => handleToolClick({ id: 'color', value: color })}
                  className={clsx('color', {
                    selected: currentColor === color,
                  })}
                >
                  <Styled.Color style={{ backgroundColor: color }} />
                </Styled.ToolButton>
              ))}
            </Styled.ToolsSection>
            <Styled.Divider />
            <Styled.ToolsSection>
              <Styled.ToolButton icon="undo" onClick={() => editor?.undo()} />
              <Styled.ToolButton icon="redo" onClick={() => editor?.redo()} />
            </Styled.ToolsSection>
            {slider && (
              <Styled.Slider
                style={{
                  top: slider.pos.y,
                }}
              >
                <Slider
                  value={slider.value}
                  step={sliders[slider.id].length}
                  onChange={slider.onChange}
                />
              </Styled.Slider>
            )}
          </Styled.Toolbar>,
          toolbarPortalEl,
        )}
    </Styled.Wrapper>
  )
}

export default Drawover

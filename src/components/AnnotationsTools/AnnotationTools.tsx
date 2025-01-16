import { FC } from 'react'
import * as Styled from './AnnotationTools.styled'
import PowerpackButton from '@components/Powerpack/PowerpackButton'

const colorMap = {
  white: {
    label: 'White',
    value: '#FFFFFF',
    icon: 'circle',
  },
  black: {
    label: 'Black',
    value: '#0A0A0A',
    icon: 'circle',
  },
  red: {
    label: 'Red',
    value: '#E61E1E',
    icon: 'circle',
  },
  blue: {
    label: 'Blue',
    value: '#369BCE',
    icon: 'circle',
  },
}

const modeMap = {
  draw: {
    icon: 'brush',
    label: 'Draw',
    shortcut: 'B',
  },
  erase: {
    icon: 'ink_eraser',
    label: 'Erase',
    shortcut: 'E',
  },
}

const AnnotationTools: FC = () => {
  return (
    <Styled.ToolbarContainer>
      <Styled.Toolbar style={{ cursor: 'default' }} className="disabled">
        <PowerpackButton feature="annotations" />
        {/* Brush Preview */}
        <svg
          width="66"
          height="40"
          viewBox="0 0 66 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.5 }}
        >
          <path
            d="M1 8C4 6 6.11281 4.17197 11.2163 3.04472C16.3198 1.91747 17.5402 6.01789 23.8648 6.01789C30.1894 6.01789 32.5 3.5 37 1"
            stroke={'white'}
            strokeWidth={5}
            strokeLinecap="round"
            style={{ transform: 'translate(14px, 14px)' }}
          />
        </svg>

        <Styled.Divider />

        {/* Tools */}
        <Styled.ToolsSection>
          {Object.entries(modeMap).map(([id, { icon }]) => (
            <Styled.ToolButton key={id} icon={icon} disabled />
          ))}
        </Styled.ToolsSection>

        <Styled.Divider />

        {/* Colors */}
        <Styled.ToolsSection>
          {Object.entries(colorMap).map(([id, { value }]) => (
            <Styled.ToolButton key={id} className="color" disabled>
              <Styled.Color style={{ backgroundColor: value }} />
            </Styled.ToolButton>
          ))}
          <Styled.ToolButton icon="palette" className="color" disabled />
          <Styled.ToolButton icon="colorize" className="color" disabled />
        </Styled.ToolsSection>

        <Styled.Divider />

        <Styled.ToolsSection>
          <Styled.ToolButton icon="undo" disabled />
          <Styled.ToolButton icon="redo" disabled />
        </Styled.ToolsSection>
      </Styled.Toolbar>
    </Styled.ToolbarContainer>
  )
}

export default AnnotationTools

import styled from 'styled-components'
import { BorderedSection } from '@ynput/ayon-react-components'

export const NoteSection = styled(BorderedSection)`
  flex: none;
  min-height: 120px;
`

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;

  &:not(.editing) {
    cursor: pointer;
  }
`

export const Editor = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;

  .md-editor {
    flex: 1;
    background-color: transparent;
  }

  .md-editor .md-content {
    padding: 12px;
  }

  .md-editor .md-placeholder {
    top: 12px;
    left: 12px;
    font-style: italic;
  }
`

export const Footer = styled.div`
  display: flex;
  justify-content: end;
  gap: 8px;
  padding: 8px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
`

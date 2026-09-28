import styled from 'styled-components'

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  height: 100%;
  padding: 8px;
  overflow: auto;
`

export const Header = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;

  h2 {
    margin: 0;
    font-size: 18px;
  }
`

export const Group = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
`

export const Toggle = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
`

export const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;

  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  min-width: 0;

  .tree-view {
    font-family: monospace;
    font-size: 11px;
    white-space: pre;
    overflow: auto;
    max-height: 400px;
    padding: 8px;
    border-radius: var(--border-radius-m);
    background-color: var(--md-sys-color-surface-container-lowest);
  }
`

export const ColumnTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--md-sys-color-outline);
  min-height: 36px;
`

export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
`

export const Tabs = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  text-transform: capitalize;
`

export const Output = styled.pre`
  margin: 0;
  padding: 10px;
  min-height: 200px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-lowest);
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
`

export const Source = styled.textarea`
  min-height: 200px;
  padding: 10px;
  resize: vertical;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface);
  font-family: monospace;
  font-size: 12px;
`

export const Preview = styled.div`
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container);
  --background-color: var(--md-sys-color-surface-container);

  /* GitHub like spacing: a gap between blocks, a blank line between markdown paragraphs */
  &.spaced > div > * + * {
    margin-top: 8px !important;
  }
  &.spaced > div > p + p {
    margin-top: 20px !important;
  }

  &.message-markdown {
    background-color: unset;
    & > div {
      padding: 0;
      background-color: unset;
    }
  }
`

export const TreeHint = styled.div`
  color: var(--md-sys-color-outline);
`

export const Hint = styled.span`
  color: var(--md-sys-color-outline);
`

export const Chat = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 170px);
  min-height: 400px;
  max-width: 900px;
  width: 100%;
  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container);
`

export const Feed = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
`

export const Message = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;

  .message-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .author {
    font-weight: 600;
  }
`

export const MessageSource = styled.pre`
  margin: 4px 0 0;
  padding: 6px 8px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-outline);
  font-family: monospace;
  font-size: 11px;
  white-space: pre-wrap;
`

// the input sits at the bottom, the mention menu opens above it over the feed
export const ChatInput = styled.div`
  position: relative;
  padding: 0 16px 16px;
`

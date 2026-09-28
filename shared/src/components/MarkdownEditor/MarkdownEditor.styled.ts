import styled from 'styled-components'

const CHECKED_ICON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='20' viewBox='0 -960 960 960' width='20' fill='%2323E0A9'%3E%3Cpath d='m427.462-343.692 233.846-232.846L620-617.846 427.462-426.308l-87-86L299.154-471l128.308 127.308ZM480.134-104q-77.313 0-145.89-29.359-68.577-29.36-120.025-80.762-51.447-51.402-80.833-119.917Q104-402.554 104-479.866q0-78.569 29.418-146.871 29.419-68.303 80.922-119.917 51.503-51.614 119.916-80.48Q402.67-856 479.866-856q78.559 0 146.853 28.839 68.294 28.84 119.922 80.422 51.627 51.582 80.493 119.841Q856-558.639 856-480.05q0 77.589-28.839 145.826-28.84 68.237-80.408 119.786-51.569 51.548-119.81 80.993Q558.702-104 480.134-104Z'/%3E%3C/svg%3E")`
const UNCHECKED_ICON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='20' viewBox='0 -960 960 960' width='20' fill='%23C4C7C5'%3E%3Cpath d='M480.409-104q-77.588 0-146.165-29.359-68.577-29.360-120.025-80.762-51.447-51.402-80.833-119.876Q104-402.471 104-480.325q0-78.110 29.418-146.412 29.419-68.303 80.922-119.917 51.503-51.614 119.875-80.480Q402.587-856 480.325-856q78.100 0 146.394 28.839 68.294 28.840 119.922 80.422 51.627 51.582 80.493 120.065Q856-558.191 856-480.326q0 77.865-28.839 146.102-28.840 68.237-80.408 119.786-51.569 51.548-120.034 80.993Q558.253-104 480.409-104ZM480-162q132.513 0 225.256-92.744Q798-347.487 798-480t-92.744-225.256Q612.513-798 480-798t-225.256 92.744Q162-612.513 162-480t92.744 225.256Q347.487-162 480-162Zm0-318Z'/%3E%3C/svg%3E")`

export const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface);

  &.bordered {
    border: 1px solid var(--md-sys-color-outline-variant);
    &:focus-within {
      border-color: var(--md-sys-color-primary);
    }
  }
`

export const Toolbar = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  padding: 4px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  min-height: 40px;

  /* hide the less used buttons when there is no room (instead of wrapping) */
  container-type: inline-size;
  @container (max-width: 480px) {
    .md-toolbar-item-heading,
    .md-toolbar-item-strikethrough {
      display: none;
    }
  }
  @container (max-width: 400px) {
    .md-toolbar-item-quote,
    .md-toolbar-item-numberList,
    .md-toolbar-divider {
      display: none;
    }
  }
  @container (max-width: 320px) {
    .md-toolbar-item-codeBlock,
    .md-toolbar-item-link {
      display: none;
    }
  }
`

export const ToolbarItems = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  justify-content: flex-end;

  .md-toolbar-button {
    padding: 4px;
    min-height: 0;
    color: var(--md-sys-color-outline);

    &:hover {
      color: var(--md-sys-color-on-surface);
    }

    &.active {
      background-color: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }
  }
`

export const ToolbarDivider = styled.span`
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background-color: var(--md-sys-color-outline-variant);
`

export const LinkEditor = styled.div`
  position: absolute;
  inset: 3px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  padding: 0 4px 0 8px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);
  box-shadow: 0 3px 15px 0 rgba(0, 0, 0, 0.3);

  .icon {
    color: var(--md-sys-color-outline);
  }

  input {
    all: unset;
    flex: 1;
    min-width: 0;
    height: 100%;
    color: var(--md-sys-color-on-surface);
  }
`

// content and the actions next to it (message variant)
export const Body = styled.div`
  display: flex;
  align-items: flex-end;
  min-width: 0;

  .md-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
  }
`

export const FloatingToolbar = styled.div`
  position: fixed;
  z-index: 1100;
  transform: translate(-50%, calc(-100% - 8px));
  display: flex;
  align-items: center;
  min-width: 200px;
  padding: 2px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);
  box-shadow: 0 3px 15px 0 rgba(0, 0, 0, 0.4);

  .md-toolbar-button {
    padding: 4px;
    min-height: 0;
    color: var(--md-sys-color-outline);
    &:hover {
      color: var(--md-sys-color-on-surface);
    }
    &.active {
      background-color: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }
  }
`

export const EditorScroller = styled.div`
  position: relative;
  overflow-y: auto;
  flex: 1;
  min-width: 0;
`

export const Placeholder = styled.div`
  position: absolute;
  top: 8px;
  left: 10px;
  right: 10px;
  color: var(--md-sys-color-outline);
  pointer-events: none;
  user-select: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

// Styles of the editable content. Kept in one place so a read only view can reuse them.
export const Content = styled.div`
  .md-content {
    outline: none;
    padding: 8px 10px;
    min-height: 100%;
    word-break: break-word;
    line-height: 20px;
    caret-color: var(--md-sys-color-on-surface);

    /* text is rendered in spans, which have a fixed font size in the global styles */
    :where(span) {
      font: inherit;
    }

    /* lines (paragraphs) sit tight, an empty line is a paragraph break, other blocks get a gap */
    & > * {
      margin: 0;
    }
    & > * + * {
      margin-top: 8px;
    }
    & > .md-paragraph + .md-paragraph {
      margin-top: 0;
    }
  }

  .md-heading {
    font-weight: 600;
  }
  .md-h1 {
    font-size: 24px;
    line-height: 32px;
  }
  .md-h2 {
    font-size: 20px;
    line-height: 28px;
  }
  .md-h3,
  .md-h4,
  .md-h5,
  .md-h6 {
    font-size: 16px;
    line-height: 24px;
  }

  .md-bold {
    font-weight: 700;
  }
  .md-italic {
    font-style: italic;
  }
  .md-strikethrough {
    text-decoration: line-through;
  }
  .md-underline {
    text-decoration: underline;
  }

  /* inline code */
  .md-code {
    font-family: monospace;
    font-size: 0.9em;
    padding: 1px 4px;
    margin: 0 1px;
    border-radius: 4px;
    background-color: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-tertiary);
    white-space: pre-wrap;
  }
  /* formatted parts of the same code span join up */
  .md-code + .md-code {
    margin-left: -1px;
    padding-left: 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  /* code block */
  .md-code-block {
    display: block;
    font-family: monospace;
    font-size: var(--md-sys-typescale-body-small-font-size);
    line-height: 18px;
    padding: 8px 10px;
    border-radius: var(--border-radius-m);
    background-color: var(--md-sys-color-surface-container-high);
    white-space: pre-wrap;
    tab-size: 2;
    overflow-x: auto;
    * {
      font-family: monospace;
    }
  }

  .md-quote {
    padding: 2px 0 2px 10px;
    border-left: 3px solid var(--md-sys-color-outline-variant);
    color: var(--md-sys-color-outline);
  }

  .md-link {
    color: var(--md-sys-color-primary);
    text-decoration: underline;
    cursor: text;
  }

  /* lists */
  .md-list {
    padding-left: 22px;
  }
  .md-list-ul {
    list-style-type: disc;
  }
  .md-list-ol {
    list-style-type: decimal;
  }
  .md-list-item {
    margin: 2px 0;
  }
  .md-list-item-nested {
    list-style-type: none;
    &::before,
    &::after {
      display: none;
    }
  }
  .md-list .md-list {
    padding-left: 18px;
  }
  .md-list-ul .md-list-ul {
    list-style-type: circle;
  }

  /* checklists, the ::before is the clickable checkbox (see CheckListPlugin) */
  .md-checklist {
    padding-left: 0;
  }
  .md-list-item-checked,
  .md-list-item-unchecked {
    position: relative;
    list-style-type: none;
    padding-left: 26px;
    min-height: 20px;
    outline: none;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 20px;
      height: 20px;
      cursor: pointer;
      background-size: 20px 20px;
      background-repeat: no-repeat;
    }
  }
  .md-list-item-unchecked::before {
    background-image: ${UNCHECKED_ICON};
  }
  .md-list-item-checked {
    color: var(--md-sys-color-outline);
    &::before {
      background-image: ${CHECKED_ICON};
    }
  }

  /* mentions */
  .mention {
    display: inline;
    padding: 1px 4px;
    border-radius: var(--border-radius-m);
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-primary);
    white-space: nowrap;
    cursor: pointer;

    &:hover {
      background-color: var(--md-sys-color-surface-container-high-hover);
    }
  }
  .mention-user,
  .mention-team {
    cursor: default;
  }
`

export const MentionMenu = styled.div`
  position: absolute;
  top: 4px;
  left: 0;
  z-index: 1100;
  width: 320px;
  max-width: calc(100vw - 16px);
  padding: 0 0 4px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);
  box-shadow: 0 3px 15px 0 rgba(0, 0, 0, 0.4);
  overflow: hidden;

  &.above {
    top: auto;
    /* the anchor sits just below the caret line */
    bottom: calc(100% + 26px);
  }

  /* fixed across the top of the editor, like a chat app */
  &.top {
    top: auto;
    left: 0;
    right: 0;
    bottom: calc(100% + 6px);
    width: auto;
    max-width: none;
  }

  ul {
    margin: 0;
    padding: 0 4px;
  }
`

export const MentionMenuTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  margin-bottom: 4px;
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-outline);
`

export const MentionFilters = styled.span`
  display: flex;
  gap: 2px;
`

export const MentionFilterButton = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--border-radius-m);
  cursor: pointer;
  color: var(--md-sys-color-outline);

  .icon {
    font-size: 16px;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
    color: var(--md-sys-color-on-surface);
  }

  &.active {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }
`

export const MentionMenuItem = styled.li`
  list-style: none;
  margin: 0;
  padding: 6px 8px;
  border-radius: var(--border-radius-m);
  display: flex;
  gap: var(--base-gap-large);
  align-items: center;
  user-select: none;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;

  &:hover,
  &.selected {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  &.empty {
    cursor: default;
    color: var(--md-sys-color-outline);
    &:hover {
      background-color: unset;
    }
  }

  .context {
    margin-right: -4px;
  }
  .label {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .suffix {
    color: var(--md-sys-color-outline);
    margin-left: auto;
  }
`

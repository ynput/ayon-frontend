import styled from 'styled-components'
import StatusSelectComponent from '@components/status/statusSelect'
import {
  Button,
  AssigneeSelect as AssigneeSelectComponent,
  TagsSelect as TagsSelectComponent,
  EnumDropdown,
} from '@ynput/ayon-react-components'

export const HeaderContainer = styled.div`
  position: relative;
`

export const Grid = styled.div`
  position: relative;
  padding: 8px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  flex: none;
  overflow: hidden;

  display: grid;
  /* two columns */
  grid-template-columns: 1fr 1fr;
  gap: var(--base-gap-large);

  /* set full widths for different elements */
  .path,
  .titles,
  .filters {
    grid-column: span 2;
  }

  &.isCompact {
    /* hide fields when compact */
    .assignee-select,
    .tags-select,
    .actions,
    .filters {
      display: none;
    }
    /* right column auto size */
    grid-template-columns: 1fr auto;
    /* align center */
    align-items: center;
  }
`

export const CloseButton = styled(Button)`
  position: absolute;
  right: 4px;
  top: 4px;
  width: fit-content;
  z-index: 50;
`

export const Header = styled.header`
  display: flex;
  align-items: flex-start;
  gap: var(--base-gap-large);
  z-index: 50;

  .entity-type {
    min-width: fit-content;
  }

  &.loading {
    .playable {
      display: none;
    }
  }
`

export const Title = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  h2 {
    min-width: fit-content;
  }
`

export const ThumbnailWrapper = styled.div`
  position: relative;
  height: 100%;

  &:hover {
    .playable {
      opacity: 0.8;
    }
  }
  & > div {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--base-gap-small);
  }
`

export const Playable = styled.span`
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 10;
  --icon-size: 14px;
  width: var(--icon-size);
  height: var(--icon-size);
  pointer-events: none;

  transition: opacity 200ms;

  .icon {
    font-variation-settings: 'FILL' 1, 'wght' 700, 'GRAD' 200, 'opsz' 24;
    font-size: var(--icon-size);
    z-index: 10;
    position: relative;
    color: var(--md-sys-color-outline-variant);
  }

  &::before {
    content: '';
    position: absolute;
    inset: 2px;
    background: var(--md-sys-color-on-surface);
    z-index: 0;
    border-radius: 100%;
  }
`

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  overflow: hidden;
  position: relative;
  border-radius: var(--border-radius-m);

  h2 {
    margin: 0;
  }

  h3 {
    display: block;
    margin: 0;
    border: none;
    padding: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &.loading {
    width: 70%;

    h2,
    h3,
    .sub-title {
      white-space: nowrap;
    }
  }

  .sub-title {
    display: flex;
    align-items: center;
    gap: var(--base-gap-medium);
  }
`

export const ContentRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  align-self: stretch;

  label {
    color: var(--md-sys-color-outline);
  }
`

export const LabelWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

export const StatusSelect = styled(StatusSelectComponent)`
  width: fit-content;
  .status-field.value {
    position: relative;
    left: 1px;
    height: 28px;
    padding-right: 8px;
    width: calc(100% - 1px);
    margin-bottom: 2px;
  }
`

export const AssigneeSelect = styled(AssigneeSelectComponent)`
  width: fit-content;
  justify-self: end;
  max-width: 100%;
`
export const TagsSelect = styled(TagsSelectComponent)`
  height: 24px;
  .template-value {
    padding: 0 2px;
  }
  .tag {
    padding: 0 4px;
  }
  .placeholder {
    padding: 0 2px;
    span:not(.icon) {
      display: none;
    }
  }
`

export const PriorityEnumDropdown = styled(EnumDropdown)`
  width: max-content;
  justify-self: end;
  /* remove text and dropdown icon */
  .control {
    display: none;
  }

  .template-value {
    border: none;
    padding: 0;
    & > div {
      justify-content: center;
    }
  }

  button {
    padding: 0 8px;
    background-color: unset;

    &:hover {
      background-color: var(--md-sys-color-surface-container-low-hover);
    }
  }
`

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  justify-content: space-between;
`

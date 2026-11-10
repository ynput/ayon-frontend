import styled from 'styled-components'
import {
  Button,
  AssigneeSelect as AssigneeSelectComponent,
  TagsSelect as TagsSelectComponent,
  StatusSelect as StatusSelectComponent,
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
  align-items: center;
  gap: var(--base-gap-large);
  z-index: 50;

  .entity-type {
    min-width: fit-content;
  }

  /* an entity without a thumbnail shows its type icon, sized like the stacked ones */
  .thumbnail .type-icon {
    font-size: 24px;
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
    gap: var(--base-gap-small);
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
interface StatusSelectProps {
  $textColor: string
}
export const StatusSelect = styled(StatusSelectComponent)<StatusSelectProps>`
  width: fit-content;
  .status-field.value {
    position: relative;
    left: 1px;
    /* the same size as the status pill in the tables and the attribute list; the component
       sets its height inline */
    height: 22px !important;
    min-height: 0;
    padding: 1px 6px 1px 4px;
    font-size: 14px;
    width: calc(100% - 1px);
    margin-bottom: 2px;
    color: ${(props) => props.$textColor};
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

export const ReadOnlyTags = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  color: var(--md-sys-color-on-surface-variant);

  span {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    height: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    border-radius: 3px;
    padding: 0 4px;
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

    /* the same size as the status pill and the pills in the tables */
    span:has(> .value-label) {
      padding: 1px 6px 1px 4px;
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

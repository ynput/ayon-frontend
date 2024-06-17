import styled from 'styled-components'
import StatusSelectComponent from '@/components/status/statusSelect'
import {
  Button,
  OverflowField,
  getShimmerStyles,
  AssigneeSelect as AssigneeSelectComponent,
  TagsSelect as TagsSelectComponent,
} from '@ynput/ayon-react-components'

export const Container = styled.div`
  position: relative;
`

export const Grid = styled.div`
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

  .thumbnail {
    width: 48px;
  }

  &.isCompact {
    /* only take up one column */
    grid-column: span 1;
  }
`

export const Path = styled(OverflowField)`
  position: relative;

  &:hover {
    z-index: 100;
  }

  &.onClose {
    padding-right: 40px;
  }

  & > span {
    transform: translate3d(0, 0, 0);
  }

  &.isLoading {
    overflow: hidden;
    border-radius: var(--border-radius-m);
    span {
      opacity: 0;
    }
    ${getShimmerStyles()}
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

  &.isLoading {
    width: 70%;
    ${getShimmerStyles()}

    h2, h3, .sub-title {
      opacity: 0;
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

  &.isLoading {
    ${getShimmerStyles()}
    border-radius: var(--border-radius-m);

    .button {
      opacity: 0;
    }
  }
`

export const AssigneeSelect = styled(AssigneeSelectComponent)`
  width: fit-content;
  justify-self: end;
  max-width: 100%;
`
export const TagsSelect = styled(TagsSelectComponent)`
  width: fit-content;
  justify-self: end;
  max-width: 100%;
`

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  justify-content: space-between;
`

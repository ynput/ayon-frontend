import styled, { css } from 'styled-components'

export const FolderSequenceWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  width: 100%;
  align-items: flex-end;

  .seq {
    /* lower depth have a higher z-index */
    z-index: ${({ $depth, $index }) => 100 - $depth - $index};
    /* flex: 1; */
    flex-grow: 1;
    width: 100%;
  }
  .children {
    /* lower depth have a higher z-index */
    z-index: ${({ $depth, $index }) => 99 - $depth - $index};
  }

  &.task {
    width: 100%;
  }
`

export const SequenceContainer = styled.div`
  display: flex;
  flex-direction: column;
  /* panel */
  background-color: var(--md-sys-color-surface-container-high);
  padding: 7px 4px;
  border-radius: var(--border-radius);
  border: 1px solid transparent;
  z-index: 10;
  width: 100%;

  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  ${({ $isNew, $nesting }) =>
    $isNew &&
    !$nesting &&
    css`
      /* highlight new items */
      background-color: var(--md-sys-color-secondary-container);
      border-color: var(--md-sys-color-primary);
    `}

  ${({ $nesting }) =>
    !$nesting &&
    css`
      background-color: unset;
      border: none;
    `}

  .icon {
    font-size: 20px;
  }

  .form > .icon {
    padding: 5px 0;
  }
`
export const TaskContainer = styled(SequenceContainer)`
  & > div {
    align-items: center;
  }

  /* lower depth have a higher z-index */
  z-index: ${({ $depth, $index }) => 100 - $depth - $index};

  border-radius: var(--border-radius-l);
  padding-bottom: 4px;
  padding: 2px 4px;
`

export const SequenceForm = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: var(--base-gap-small);
  width: 100%;
  .delete {
    margin-left: auto;
  }

  strong {
    font-weight: 700;
  }
`

export const InputColumn = styled.div`
  display: flex;
  flex-direction: column;
  width: min-content;

  /* input type number */
  #length {
    width: 90px;
  }

  #prefix {
    width: 53px;
  }

  label {
    width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

export const Children = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  justify-content: flex-end;

  /* has no children then display none */
  &:empty {
    display: none;
  }
  width: 100%;
`

export const RowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--base-gap-small);
  width: 100%;
`

export const AddButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  z-index: 10;
`

export const Example = styled.span``

export const Prefix = styled.span`
  background-color: var(--md-sys-color-surface-container-low);
  padding: 5px 8px;
  border-radius: var(--border-radius);
  position: relative;
  top: -1px;
  right: -3px;

  color: var(--md-sys-color-outline);
  min-height: 30px;
`

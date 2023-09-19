import styled, { css } from 'styled-components'

export const FolderSequenceWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  width: max-content;
  align-items: flex-end;
  .form {
    /* get smaller as depth gets higher */
    /* input type text */
    input[type='text'] {
      min-width: ${({ $depth }) => `${300 - $depth * 20}px`};
    }
  }

  .seq {
    /* lower depth have a higher z-index */
    z-index: ${({ $depth, $index }) => 100 - $depth - $index};
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
  padding: 2px 4px;
  border-radius: var(--border-radius);
  border: 1px solid transparent;
  z-index: 10;

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

  .form > .icon {
    padding: 0;
    padding-top: 20px;
  }
`

export const SequenceForm = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: var(--base-gap-small);

  .delete {
    margin-left: auto;
  }
`

export const InputColumn = styled.div`
  display: flex;
  flex-direction: column;

  input {
    max-height: 30px;
    min-height: 30px;
  }

  /* input type number */
  input[type='number'] {
    width: 150px;
  }

  /* input type text */
  input[type='text'] {
    min-width: 200px;
  }
`

export const Children = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);

  /* if children has no folders then make 100% width for task */
  &:not(:has(.folder)) {
    width: calc(100% - ${({ $depth }) => ($depth === 0 ? 84 : 0)}px);
  }

  /* has no children then display none */
  &:empty {
    display: none;
  }
`

export const RowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--base-gap-small);
`

export const AddButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  z-index: 10;
`

export const Example = styled.span``

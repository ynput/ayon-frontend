import styled from 'styled-components'

// handle, source, arrow, destination, X: the headings use the same columns as the pairs
const PAIR_COLUMNS =
  'var(--settings-handle-size, 24px) minmax(0, 1fr) var(--space-8) minmax(0, 1fr) var(--base-input-size)'

export const Mapping = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
  width: 100%;
  /* inset like a list in a panel: 12px from its edges, with the 6px the panel already gives */
  padding: calc(var(--space-3) / 2) var(--space-3);
`

export const Headings = styled.div`
  display: grid;
  grid-template-columns: ${PAIR_COLUMNS};
  align-items: end;
  min-height: var(--settings-label-height, 20px);
`

const LEVEL_COLORS: Record<string, string> = {
  studio: 'var(--color-hl-studio)',
  project: 'var(--color-hl-project)',
  site: 'var(--color-hl-site)',
  edit: 'var(--color-changed)',
}

// like a field's label: its colour shows where the value comes from, a click selects it
export const Heading = styled.span<{ $level: string }>`
  /* the second heading starts where its input's text does */
  padding: 0 var(--space-2, 8px);
  color: ${({ $level }) => LEVEL_COLORS[$level] ?? 'inherit'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  user-select: none;
`

export const Pair = styled.div`
  display: grid;
  grid-template-columns: ${PAIR_COLUMNS};
  align-items: center;
  height: var(--base-input-size);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-m);
  background-color: var(--settings-input-bg, var(--md-sys-color-surface-container));
  /* the pair's own stacking context, like a list row (see SettingsEditor.sass) */
  isolation: isolate;

  &:focus-within {
    border-color: var(--md-sys-color-primary);
  }

  &.is-dragging {
    position: relative;
    z-index: 1;
    box-shadow: 0 2px 8px var(--md-sys-color-shadow);
  }
`

export const Handle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: grab;
  opacity: 0;
  transition: opacity 0.15s;

  ${Pair}:hover &,
  ${Pair}:focus-within &,
  &:focus-visible {
    opacity: 0.6;
  }
  &:hover {
    opacity: 1;
  }
`

export const PathInput = styled.input`
  min-width: 0;
  height: 100%;
  padding: 0 var(--space-2, 8px);
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--md-sys-color-on-surface);
  font: inherit;

  &::placeholder {
    color: var(--md-sys-color-outline);
  }
`

export const Arrow = styled.span`
  display: flex;
  justify-content: center;
  color: var(--md-sys-color-on-surface-variant);
`

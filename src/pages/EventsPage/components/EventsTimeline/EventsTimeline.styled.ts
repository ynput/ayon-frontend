import styled, { keyframes } from 'styled-components'
import { theme } from '@ynput/ayon-react-components'

export const GUTTER = 128
export const HISTOGRAM_HEIGHT = 40
export const AXIS_HEIGHT = 28
export const DAY_ROW_HEIGHT = 36

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 var(--marker-color); }
  50% { box-shadow: 0 0 0 4px transparent; }
`

export const Container = styled.div`
  position: relative;
  container-type: inline-size;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-low);
  user-select: none;
  touch-action: none;
  cursor: grab;
  outline: none;

  &.dragging {
    cursor: grabbing;
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 2px var(--md-sys-color-primary);
  }
`

export const Row = styled.div`
  position: relative;
  display: flex;
  flex-shrink: 0;
`

export const GutterCell = styled.div`
  width: ${GUTTER}px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);
  border-right: 1px solid var(--md-sys-color-outline-variant);
  z-index: 2;
  ${theme.labelMedium}
  color: var(--md-sys-color-on-surface-variant);

  .icon {
    font-size: 16px;
  }

  .label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    opacity: 0.7;
    font-variant-numeric: tabular-nums;
  }
`

export const Plot = styled.div`
  position: relative;
  flex: 1;
  overflow: hidden;
`

export const DayRow = styled(Row)`
  height: ${DAY_ROW_HEIGHT}px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

export const DayLabel = styled.span`
  position: absolute;
  top: 10px;
  padding: 0 6px;
  white-space: nowrap;
  ${theme.labelSmall}
  color: var(--md-sys-color-on-surface-variant);
  border-left: 1px solid var(--md-sys-color-outline);
`

export const Histogram = styled(Row)`
  height: ${HISTOGRAM_HEIGHT}px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

export const Bar = styled.div`
  position: absolute;
  bottom: 0;
  min-width: 1px;
  border-radius: 2px 2px 0 0;
  background-color: var(--md-sys-color-primary);
  opacity: 0.45;
  cursor: zoom-in;

  &:hover {
    opacity: 0.8;
  }

  .errors {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--md-sys-color-error);
  }
`

export const Lanes = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
`

export const Lane = styled(Row)`
  flex: 1 0 30px;
  max-height: 64px;
  border-bottom: 1px solid var(--md-sys-color-surface-container);

  &.active ${GutterCell} {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container);
  }
`

export const GridLine = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: var(--md-sys-color-surface-container-high);
  pointer-events: none;

  &.major {
    background-color: var(--md-sys-color-outline-variant);
  }
`

export const Marker = styled.div`
  --marker-color: var(--md-sys-color-outline);
  position: absolute;
  top: 50%;
  height: 10px;
  min-width: 10px;
  transform: translate(-5px, -50%);
  border-radius: 6px;
  background-color: var(--marker-color);
  cursor: pointer;
  transition: transform 80ms ease;

  &:hover {
    transform: translate(-5px, -50%) scale(1.3);
    z-index: 1;
  }

  &.cluster {
    height: 18px;
    min-width: 18px;
    transform: translate(-9px, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border-radius: 9px;
    color: #11141a;
    font-size: 11px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    cursor: zoom-in;

    &:hover {
      transform: translate(-9px, -50%) scale(1.08);
    }
  }

  &.error,
  &.warning {
    box-shadow: 0 0 0 2px var(--md-sys-color-surface-container-low);
  }

  &.active {
    animation: ${pulse} 1.6s ease-in-out infinite;
  }

  &.selected {
    outline: 2px solid var(--md-sys-color-on-surface);
    outline-offset: 2px;
    z-index: 2;
  }
`

export const Axis = styled(Row)`
  height: ${AXIS_HEIGHT}px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
`

export const TickLabel = styled.span`
  position: absolute;
  top: 6px;
  transform: translateX(-50%);
  white-space: nowrap;
  ${theme.labelSmall}
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;

  &.major {
    color: var(--md-sys-color-on-surface);
    font-weight: 600;
  }
`

export const Overlay = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  pointer-events: none;
`

export const NowLine = styled(Overlay)`
  width: 0;
  border-left: 1px dashed var(--md-sys-color-tertiary);
`

export const SelectedLine = styled(Overlay)`
  width: 0;
  border-left: 1px solid var(--md-sys-color-on-surface);
  opacity: 0.4;
`

/** Time range that has not been loaded yet */
export const Unloaded = styled(Overlay)`
  left: 0;
  background: repeating-linear-gradient(
    135deg,
    transparent 0 6px,
    var(--md-sys-color-surface-container) 6px 12px
  );
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12px;
  pointer-events: auto;
  cursor: inherit;

  button {
    pointer-events: auto;
  }
`

export const Hint = styled.div`
  position: absolute;
  bottom: ${AXIS_HEIGHT + 12}px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 4px 12px;
  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-highest);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 5;
  cursor: default;
  white-space: nowrap;
`

export const Tooltip = styled.div`
  position: absolute;
  z-index: 10;
  width: max-content;
  max-width: 340px;
  padding: 8px 10px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-highest);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  ${theme.bodySmall}

  .title {
    ${theme.labelLarge}
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .description {
    color: var(--md-sys-color-on-surface);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    word-break: break-word;
  }

  .meta {
    color: var(--md-sys-color-on-surface-variant);
  }

  .hint {
    margin-top: 4px;
    color: var(--md-sys-color-on-surface-variant);
    opacity: 0.8;
  }
`

export const SrOnly = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
`

export const Controls = styled.div`
  position: absolute;
  top: 2px;
  right: 4px;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-highest);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  cursor: default;

  button.preset {
    min-width: 32px;
    height: 28px;
    padding: 0 6px;
    border: none;
    border-radius: var(--border-radius-m);
    background: transparent;
    color: var(--md-sys-color-on-surface);
    cursor: pointer;
    ${theme.labelMedium}

    &:hover {
      background-color: var(--md-sys-color-surface-container-hover);
    }
    &.active {
      background-color: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
    }
    &:focus-visible {
      outline: 2px solid var(--md-sys-color-primary);
    }
  }

  .span {
    min-width: 40px;
    text-align: center;
    ${theme.labelSmall}
    color: var(--md-sys-color-on-surface-variant);
    font-variant-numeric: tabular-nums;
  }

  @container (max-width: 640px) {
    button.preset,
    .span {
      display: none;
    }
  }
`

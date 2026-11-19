import styled from 'styled-components'
import { theme } from '@ynput/ayon-react-components'
import { COMPARE_COLOR } from './settingsHistoryHelpers'

export const GUTTER = 148
export const LANE_HEIGHT = 38
export const AXIS_HEIGHT = 22
/** vertical centre of the markers inside a lane, version labels sit above it */
export const LANE_MID = 24
/** size of the avatar of who saved, the marker of a save */
export const AVATAR = 18
export const TOOLTIP_WIDTH = 380
/** the saves of a cluster, picked from */
export const LIST_WIDTH = 440

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-low);
  overflow: hidden;
`

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 2px 4px 2px 10px;
  ${theme.labelMedium}
  color: var(--md-sys-color-on-surface-variant);

  .title {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--md-sys-color-on-surface);
    ${theme.titleSmall}
    white-space: nowrap;

    .icon {
      font-size: 18px;
    }
  }

  .summary {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .spacer {
    flex: 1;
  }

  button.preset {
    min-width: 30px;
    height: 26px;
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

  .presets {
    display: flex;
    flex-shrink: 0;
    gap: 2px;
  }

  @container (max-width: 720px) {
    .presets {
      display: none;
    }
  }
`

export const CompareChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  height: 26px;
  padding: 0 2px 0 10px;
  border-radius: 13px;
  background-color: color-mix(in srgb, var(--compare-color) 18%, transparent);
  color: var(--md-sys-color-on-surface);
  white-space: nowrap;
  ${theme.labelMedium}

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  strong {
    color: var(--compare-color);
  }

  button {
    width: 22px;
    height: 22px;
    min-height: 0;
    padding: 0;
    border-radius: 50%;
  }
`

export const Body = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  user-select: none;
  touch-action: none;
  cursor: crosshair;
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
  padding: 0 8px 0 10px;
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);
  border-right: 1px solid var(--md-sys-color-outline-variant);
  z-index: 3;
  cursor: default;
  ${theme.labelMedium}
  color: var(--md-sys-color-on-surface-variant);

  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--md-sys-color-on-surface);
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

export const Lane = styled(Row)`
  height: ${LANE_HEIGHT}px;

  & + & {
    border-top: 1px solid var(--md-sys-color-surface-container);
  }
`

export const VersionSegment = styled.div`
  position: absolute;
  top: ${LANE_MID - 1}px;
  height: 2px;
  border-radius: 1px;
  background-color: var(--lane-color);
  opacity: 0.25;
  pointer-events: none;

  &.current {
    opacity: 0.55;
  }
`

export const VersionLabel = styled.span`
  position: absolute;
  top: 1px;
  padding-left: 4px;
  border-left: 1px solid var(--lane-color);
  white-space: nowrap;
  font-size: 10px;
  line-height: 13px;
  color: var(--md-sys-color-on-surface-variant);
  pointer-events: none;

  &.current {
    color: var(--md-sys-color-on-surface);
  }
`

/** One save: the avatar of who saved it, ringed in the addon colour. Several: a stack and a count */
export const Marker = styled.div`
  position: absolute;
  top: ${LANE_MID}px;
  height: ${AVATAR}px;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
  border-radius: ${AVATAR / 2}px;
  cursor: pointer;
  transition: transform 80ms ease, opacity 120ms ease;
  z-index: 1;

  .avatar {
    flex-shrink: 0;
    border: none;
    box-shadow: 0 0 0 2px var(--lane-color);
    background-color: var(--md-sys-color-surface-container-highest);

    .initials {
      font-size: 9px !important;
    }
  }

  &:hover,
  &.open {
    transform: translateY(-50%) scale(1.15);
    z-index: 2;
  }

  &.cluster {
    height: ${AVATAR + 4}px;
    margin-left: -2px;
    padding: 0 0 0 2px;
    border-radius: ${AVATAR / 2 + 2}px;
    background-color: color-mix(
      in srgb,
      var(--lane-color) 28%,
      var(--md-sys-color-surface-container-low)
    );
    box-shadow: inset 0 0 0 1.5px var(--lane-color);

    &:hover,
    &.open {
      transform: translateY(-50%) scale(1.06);
    }

    .avatar {
      box-shadow: 0 0 0 1.5px var(--md-sys-color-surface-container-low);
    }

    /* stacked, the newest on top */
    .avatar + .avatar {
      margin-left: -8px;
    }
    .avatar:nth-child(1) {
      z-index: 3;
    }
    .avatar:nth-child(2) {
      z-index: 2;
    }

    .count {
      padding: 0 6px 0 4px;
      color: var(--md-sys-color-on-surface);
      font-size: 11px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }

  /* before the compared time: context only */
  &.before {
    opacity: 0.4;
  }

  &.selected {
    outline: 2px solid var(--md-sys-color-on-surface);
    outline-offset: 3px;
    opacity: 1;
    z-index: 2;
  }
`

export const Axis = styled(Row)`
  height: ${AXIS_HEIGHT}px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
`

/** Time before the oldest loaded change, when older changes exist but were not loaded */
export const Unloaded = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: repeating-linear-gradient(
    135deg,
    transparent 0 6px,
    var(--md-sys-color-surface-container) 6px 12px
  );
`

export const TickLabel = styled.span`
  position: absolute;
  top: 4px;
  transform: translateX(-50%);
  white-space: nowrap;
  ${theme.labelSmall}
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;

  &.major {
    color: var(--md-sys-color-on-surface);
  }
`

export const Overlay = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  pointer-events: none;
`

export const GridLine = styled(Overlay)`
  width: 1px;
  background-color: var(--md-sys-color-surface-container-high);

  &.major {
    background-color: var(--md-sys-color-outline-variant);
  }
`

export const NowLine = styled(Overlay)`
  width: 0;
  border-left: 1px dashed var(--md-sys-color-outline);
`

/** Everything saved since the compared time */
export const SinceRange = styled(Overlay)`
  background-color: color-mix(in srgb, var(--compare-color) 9%, transparent);
`

export const CompareLine = styled(Overlay)`
  width: 0;
  border-left: 2px solid var(--compare-color);
  z-index: 2;
`

export const HoverLine = styled(Overlay)`
  width: 0;
  border-left: 1px solid var(--md-sys-color-on-surface);
  opacity: 0.35;
`

/** Time label in the axis row, covers the tick labels below it */
export const AxisFlag = styled.span`
  position: absolute;
  top: 2px;
  transform: translateX(-50%);
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 4;
  ${theme.labelSmall}
  font-variant-numeric: tabular-nums;
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface);
  pointer-events: none;

  &.compare {
    background-color: var(--compare-color);
    color: #2a2100;
    font-weight: 600;
  }
`

export const Tooltip = styled.div`
  position: fixed;
  z-index: 1100;
  width: max-content;
  max-width: ${TOOLTIP_WIDTH}px;
  padding: 10px 12px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-highest);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  ${theme.bodySmall}
  color: var(--md-sys-color-on-surface);

  .who {
    display: flex;
    align-items: center;
    gap: 8px;
    ${theme.labelLarge}
  }

  /* the saves of a mark, to pick one from */
  &.list {
    width: ${LIST_WIDTH}px;
    max-width: ${LIST_WIDTH}px;
    padding: 8px 4px 4px;
    pointer-events: auto;
  }

  .list-title {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px 4px;
    ${theme.labelMedium}
    color: var(--md-sys-color-on-surface-variant);
  }

  .changes {
    max-height: 272px;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }

  .change {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto auto;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 5px 8px;
    border: none;
    border-radius: var(--border-radius-m);
    background: transparent;
    text-align: left;
    color: var(--md-sys-color-on-surface);
    cursor: pointer;
    ${theme.bodySmall}

    &:hover {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
    &:focus-visible {
      outline: 2px solid var(--md-sys-color-primary);
      outline-offset: -2px;
    }
    &.selected {
      box-shadow: inset 3px 0 0 ${COMPARE_COLOR};
      background-color: var(--md-sys-color-surface-container-high);
    }

    .user {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      ${theme.labelLarge}
    }

    .count,
    .date,
    .version {
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
      color: var(--md-sys-color-on-surface-variant);
    }

    .version.older {
      opacity: 0.7;
    }
  }

  .meta {
    color: var(--md-sys-color-on-surface-variant);
  }

  .version {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .swatch {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }

  .diffs {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }

  .diff {
    display: flex;
    flex-direction: column;
  }

  .path {
    color: var(--md-sys-color-on-surface-variant);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    b {
      color: var(--md-sys-color-on-surface);
      font-weight: 600;
    }
  }

  .values {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    overflow: hidden;
    white-space: nowrap;

    .before,
    .after {
      font-family: monospace;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .before {
      color: var(--md-sys-color-on-surface-variant);
      text-decoration: line-through;
    }

    .note {
      color: var(--md-sys-color-on-surface-variant);
    }

    .icon {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }
  }

  .hint {
    margin-top: 4px;
    color: var(--md-sys-color-on-surface-variant);
    opacity: 0.85;
  }
`

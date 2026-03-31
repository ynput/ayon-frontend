import { Button, Icon, IconProps, Panel } from "@ynput/ayon-react-components"
import clsx from "clsx"
import styled from "styled-components"

type StatsItem = {
  text: string
  icon: IconProps["icon"]
  rotated?: boolean
  danger?: boolean
}

type Props = {
  heading: string
  subtitle?: string
  size: string,
  items: StatsItem[]
  onClose?: () => void
}

export const StatsWrapper = styled.div`
  flex-grow: 1;
  align-content: center;
  justify-content: center;
`

export const StatsPanel = styled(Panel)`
  background: var(--md-sys-color-surface-container-high);
  margin: 0 auto;
  max-width: max-content;
`
export const Stat = styled(Panel)`
  background: var(--md-sys-color-surface-container-low);
  padding: var(--padding-s);

  &.danger {
    background: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
  }
`
export const StatsHeading = styled.h2`
  margin: 0;
  font-size: inherit;
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  min-width: 300px;
`
export const StatsSubtitle = styled.p`
  margin: 0;
`
export const StatsFileSize = styled.span`
  color: var(--md-sys-color-outline);
  margin-left: 1ch;
`
export const StatsRemove = styled(Button)`
  margin-left: auto;
  margin-right: 0;
`

export default function Stats({ heading, subtitle, size, items, onClose }: Props) {
  return (
    <StatsWrapper>
      <StatsPanel>
        <StatsHeading>
          {heading}
          {
            size && (
              <StatsFileSize>
                {size}
              </StatsFileSize>
            )
          }
          {
            onClose && (
              <StatsRemove
                icon="close"
                variant="nav"
                onClick={onClose}
              />
            )
          }
        </StatsHeading>
        {
          subtitle && <StatsSubtitle>{subtitle}</StatsSubtitle>
        }
        {
          items.map((item, index) => (
            <Stat key={index} direction="row" className={clsx({ danger: item.danger })}>
              <Icon
                icon={item.icon}
                style={{
                  rotate: item.rotated ? "90deg" : "0deg",
                }}
              />
              {item.text}
            </Stat>
          ))
        }
      </StatsPanel>
    </StatsWrapper>
  )
}

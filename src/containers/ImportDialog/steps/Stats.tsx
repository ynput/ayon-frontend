import { Icon, IconProps } from "@ynput/ayon-react-components"
import clsx from "clsx"
import {
  StatsWrapper,
  StatsPanel,
  Stat,
  StatsHeading,
  StatsSubtitle,
  StatsFileSize,
  StatsRemove,
} from "./Stats.styled"

export type StatsItem = {
  text: string
  icon: IconProps["icon"]
  rotated?: boolean
  danger?: boolean
  tooltip?: string
}

type Props = {
  heading: string
  subtitle?: string
  size: string,
  items: StatsItem[]
  onClose?: () => void
}

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
            <Stat
              key={index}
              direction="row"
              className={clsx({ danger: item.danger })}
              {
                ...(
                  item.tooltip
                  ? {
                    "data-tooltip": item.tooltip,
                    "data-tooltip-delay": 0,
                    "data-tooltip-as": "markdown",
                  }
                  : {}
                )
              }
            >
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

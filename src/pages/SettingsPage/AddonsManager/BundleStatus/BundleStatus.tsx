import * as Styled from './BundleStatus.styled'

type Props = {
  statuses: string[]
}

const BundleStatus = ({ statuses = [] }: Props) => {
  if (!statuses?.length) return null
  return (
    <Styled.StatusDots className="status-dots">
      <div className="wrapper">
        {statuses.map((status) => (
          <span
            key={status}
            style={{ color: `var(--color-hl-${status})` }}
            data-tooltip={formatTooltip(statuses)}
            data-tooltip-delay={0}
          >
            •
          </span>
        ))}
      </div>
    </Styled.StatusDots>
  )
}

export default BundleStatus

const formatTooltip = (statuses: string[]) => statuses.join(', ')

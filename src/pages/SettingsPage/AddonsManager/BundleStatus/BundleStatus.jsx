import * as Styled from './BundleStatus.styled'

const BundleStatus = ({ statuses = [] }) => {
  if (!statuses?.length) return null
  return (
    <Styled.StatusDots className="status-dots">
      <div className="wrapper">
        {statuses.map((status) => (
          <span key={status} style={{ color: `var(--color-hl-${status})` }}>
            •
          </span>
        ))}
      </div>
    </Styled.StatusDots>
  )
}

export default BundleStatus

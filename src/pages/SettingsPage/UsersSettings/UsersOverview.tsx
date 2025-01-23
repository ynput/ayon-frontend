import styled from 'styled-components'

const Totals = styled.div`
  display: flex;
  align-items: center;
  padding: 2px;
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: var(--border-radius-m);
  overflow: hidden;
`

const Total = styled.div`
  padding: 4px 6px;
  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
    border-radius: var(--border-radius-m);
  }

  white-space: nowrap;
`

type User = {
  isAdmin: boolean
  isManager: boolean
  isService: boolean
  active: boolean
}

type UsersOverviewProps = {
  users: User[]
}

const UsersOverview = ({ users = [] }: UsersOverviewProps) => {
  const usersWithoutService = users.filter((user) => !user.isService)

  const totals: {
    [key: string]: {
      label: string
      tooltip?: string
      value: number
    }
  } = {
    total: {
      label: 'Total users',
      tooltip: 'Total number of users not including services',
      value: usersWithoutService.length,
    },
    active: {
      label: 'Active',
      value: usersWithoutService.filter((user) => user.active).length,
    },
    admins: {
      label: 'Admins',
      value: usersWithoutService.filter((user) => user.isAdmin).length,
    },
    managers: {
      label: 'Managers',
      value: usersWithoutService.filter((user) => user.isManager).length,
    },
    services: {
      label: 'Services',
      value: users.filter((user) => user.isService).length,
    },
  }

  return (
    <Totals>
      {Object.entries(totals).map(([key, { label, tooltip, value }]) => (
        <Total key={key} data-tooltip={tooltip} data-tooltip-delay={0}>
          <strong>{label}</strong>: {value}
        </Total>
      ))}
    </Totals>
  )
}

export default UsersOverview

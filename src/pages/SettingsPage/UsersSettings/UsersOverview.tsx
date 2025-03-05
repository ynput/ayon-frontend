import { UserPoolModel } from '@api/rest/auth'
import { useGetUserPoolsQuery } from '@queries/auth/getAuth'
import { useMemo } from 'react'
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
  const { data: userPools = [] } = useGetUserPoolsQuery()
  const isUsingPools = !!userPools.length

  const totalLicenses = useMemo(() => getLicensesTotal(userPools), [userPools])

  const totals: {
    [key: string]: {
      label: string
      tooltip?: string
      value: number | string
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

  // add licenses to the totals if there are pools
  if (isUsingPools) {
    totals.licenses = {
      label: 'Licenses',
      tooltip: getLicensesTooltip(totalLicenses),
      value: getLicensesString(totalLicenses),
    }
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

type LicsCount = {
  fixed: {
    used: number
    max: number
  }
  metered: {
    used: number
    max: number
  }
  total: {
    used: number
    max: number
  }
}
const getLicensesTotal = (userPools: UserPoolModel[]): LicsCount => {
  const total: LicsCount = {
    fixed: { used: 0, max: 0 },
    metered: { used: 0, max: 0 },
    total: { used: 0, max: 0 },
  }
  for (const pool of userPools) {
    if (pool.type === 'fixed') {
      total.fixed.max += pool.max
      total.fixed.used += pool.used
    }
    if (pool.type === 'metered') {
      total.metered.max += pool.max
      total.metered.used += pool.used
    }
    // update total
    total.total.max += pool.max
    total.total.used += pool.used
  }

  return total
}

const getLicensesString = (counts: LicsCount): string => {
  return `${counts.total.used}/${counts.total.max}`
}

// full details on the licenses
const getLicensesTooltip = (counts: LicsCount): string => {
  return `Base: ${counts.fixed.used}/${counts.fixed.max}\nMetered: ${counts.metered.used}/${counts.metered.max}`
}

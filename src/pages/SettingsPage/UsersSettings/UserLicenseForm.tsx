import { UserPoolModel } from '@api/rest/auth'
import { useGetUserPoolsQuery } from '@queries/auth/getAuth'
import { Dropdown, FormLayout, FormRow, InputSwitch } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'

const FormRowStyled = styled(FormRow)`
  .label {
    min-width: 160px;
  }
`

interface UserLicenseFormProps {
  active: boolean
  pool: string
  isPoolMixed: boolean
  isDisabled?: boolean
  onActiveChange: (value: boolean) => void
  onPoolChange: (value: string) => void
}

const UserLicenseForm: FC<UserLicenseFormProps> = ({
  active,
  pool,
  isPoolMixed,
  isDisabled,
  onActiveChange,
  onPoolChange,
}) => {
  // GET LICENSE USER POOLS
  const { data: userPools = [], isLoading: isLoadingPools } = useGetUserPoolsQuery()
  const isUsingPools = !!userPools.length

  return (
    <>
      <b>{isUsingPools ? 'License control' : 'Login control'}</b>
      <FormLayout>
        <FormRowStyled label="User active">
          <div style={{ width: 'fit-content' }}>
            <InputSwitch
              checked={active}
              // @ts-ignore
              onChange={(e) => onActiveChange(e.target.checked)}
              disabled={isDisabled}
            />
          </div>
        </FormRowStyled>
        {isUsingPools && (
          <FormRowStyled label="User license">
            <Dropdown
              value={isPoolMixed ? [pool] : [pool]}
              options={buildPoolsOptions(userPools)}
              disabledValues={disabledPools(userPools)}
              disabled={!active || isLoadingPools || isDisabled}
              isMultiple={isPoolMixed}
              data-tooltip="User requires an assigned license pool to log in"
              onChange={(value) => onPoolChange(value[0])}
            />
          </FormRowStyled>
        )}
      </FormLayout>
    </>
  )
}

export default UserLicenseForm

const buildPoolsOptions = (pools: UserPoolModel[]): { value: string; label: string }[] => {
  return pools.map((pool) => ({
    value: pool.id,
    label: `${pool.label} (${pool.used}/${pool.max})`,
  }))
}

// has 0 max
const disabledPools = (pools: UserPoolModel[]): string[] => {
  return pools
    .filter((pool) => pool.max === 0 || pool.used >= pool.max || !pool.valid)
    .map((pool) => pool.id)
}

import styled from 'styled-components'
import CategorySelect from '/src/components/CategorySelect/CategorySelect'
import ColumnsSelect from '/src/components/ColumnsSelect/ColumnsSelect'

export const TaskFilterDropdown = styled(CategorySelect)`
  min-width: 160px;
  max-width: 160px;
`

export const ColumnsFilterSelect = styled(ColumnsSelect)`
  min-width: 170px;
  max-width: 170px;
`

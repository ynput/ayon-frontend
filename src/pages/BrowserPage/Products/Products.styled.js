import styled from 'styled-components'
import CategorySelect from '@components/CategorySelect/CategorySelect'
import ColumnsSelect from '@components/ColumnsSelect/ColumnsSelect'

export const TaskFilterDropdown = styled(CategorySelect)`
  min-width: 160px;
  max-width: 160px;
`

export const ColumnsFilterSelect = styled(ColumnsSelect)`
  min-width: 170px;
  max-width: 170px;
`

export const EntityLinkCell = styled.span`
  cursor: pointer;
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    text-decoration: underline;
  }
`

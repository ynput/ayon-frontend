import * as Styled from './UserDashDetailsFilters.styled'
import { useDispatch, useSelector } from 'react-redux'
import { onDetailsFilterChange } from '/src/features/dashboard'

const UserDashDetailsFilters = () => {
  const dispatch = useDispatch()
  const setAttributesOpen = (value) => dispatch(onDetailsFilterChange(value))
  const selectedFilter = useSelector((state) => state.dashboard.details.filter)

  const filters = [
    {
      id: 'activity',
      label: 'Activity',
      icon: 'forum',
    },
    // {
    //   id: 'versions',
    //   label: 'Versions',
    //   icon: 'layers',
    // },
    {
      id: 'checklists',
      label: 'Checklists',
      icon: 'checklist',
    },
    {
      id: 'details',
      label: 'Details',
      icon: 'segment',
    },
  ]

  return (
    <Styled.FiltersToolbar>
      {filters.map((filter) => (
        <Styled.FilterButton
          key={filter.id}
          selected={filter.id === selectedFilter}
          onClick={() => setAttributesOpen(filter.id)}
          //   icon={filter.icon}
          label={filter.label}
        />
      ))}
    </Styled.FiltersToolbar>
  )
}

export default UserDashDetailsFilters

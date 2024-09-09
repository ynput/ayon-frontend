import { ReleaseAddon } from '@api/rest/releases'
import AddonCard from '@components/AddonCard/AddonCard'
import { FC } from 'react'
import styled from 'styled-components'

const Grid = styled.div`
  /* 3 column grid */
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--base-gap-small);
  width: 470px;
  max-width: 470px;
  max-height: 422px;

  overflow: auto;
`

type Addon = Pick<ReleaseAddon, 'name' | 'title' | 'version'>

interface AddonsSelectGridProps {
  isLoading: boolean
  placeholderCount: number
  addons: Addon[]
  selected: string[]
  onSelect: (name: string) => void
}

const AddonsSelectGrid: FC<AddonsSelectGridProps> = ({
  isLoading,
  placeholderCount,
  addons,
  selected,
  onSelect,
}) => {
  const placeholders = [...Array(placeholderCount)].map((_, i) => `Addon ${i}`)

  return (
    <Grid>
      {isLoading
        ? placeholders.map((placeholder) => (
            <AddonCard key={placeholder} className="loading" icon={''} />
          ))
        : addons.map((addon) => (
            <AddonCard
              key={addon.name}
              title={addon.title}
              name={addon.name}
              endContent={addon.version}
              icon={selected.includes(addon.name) ? 'check_circle' : 'circle'}
              isSelected={selected.includes(addon.name)}
              onClick={() => onSelect(addon.name)}
            />
          ))}
    </Grid>
  )
}

export default AddonsSelectGrid

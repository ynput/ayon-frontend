import { AddonVersionDetail } from '@shared/api'
import AddonCard, { AddonCardProps } from '@components/AddonCard/AddonCard'
import clsx from 'clsx'
import { FC, HTMLAttributes } from 'react'
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

type Addon = Pick<AddonVersionDetail, 'name' | 'title' | 'version'>

interface AddonsSelectGridProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  isLoading: boolean
  placeholderCount: number
  addons: Addon[]
  disabledAddons?: string[]
  selected: string[]
  onSelect: (name: string) => void
  pt?: {
    card?: AddonCardProps
  }
}

const AddonsSelectGrid: FC<AddonsSelectGridProps> = ({
  isLoading,
  placeholderCount,
  addons,
  disabledAddons = [],
  selected,
  onSelect,
  pt = {},
  ...props
}) => {
  const placeholders = [...Array(placeholderCount)].map((_, i) => `Addon ${i}`)

  return (
    <Grid {...props}>
      {isLoading
        ? placeholders.map((placeholder) => (
            <AddonCard
              key={placeholder}
              icon={''}
              {...pt.card}
              className={clsx('loading', pt.card?.className)}
            />
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
              disabled={disabledAddons.includes(addon.name)}
              {...pt.card}
            />
          ))}
    </Grid>
  )
}

export default AddonsSelectGrid

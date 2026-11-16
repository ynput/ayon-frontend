import { lazy, Suspense } from 'react'
import type { EntityTableProps } from '@ynput/ayon-addon'
import * as Styled from './EntityTable.styled'

// the Overview's data layer loads only when an addon renders the table
const AddonEntityTable = lazy(() => import('./AddonEntityTable'))

export const LazyEntityTable = (props: EntityTableProps) => (
  <Suspense fallback={<Styled.TableWrapper className={props.className} />}>
    <AddonEntityTable {...props} />
  </Suspense>
)

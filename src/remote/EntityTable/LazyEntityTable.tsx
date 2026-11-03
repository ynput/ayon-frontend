import { lazy, Suspense } from 'react'
import type { EntityTableProps } from '@ynput/ayon-addon'
import * as Styled from './EntityTable.styled'

// the Overview and Products data layers load only when an addon renders the table
const AddonEntityTable = lazy(() =>
  import('./AddonEntityTable').then((module) => ({ default: module.AddonEntityTable })),
)

export const LazyEntityTable = (props: EntityTableProps) => (
  <Suspense fallback={<Styled.TableWrapper className={props.className} />}>
    <AddonEntityTable {...props} />
  </Suspense>
)

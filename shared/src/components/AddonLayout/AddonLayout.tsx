// The host's implementations of ProjectPageLayout and Slicer from @ynput/ayon-addon (registered in
// src/remote/addonHost.ts): the splitter and slicer of the built-in project pages. Legacy addon
// pages with a `slicer: { fields }` key render through them too (ProjectPageRemote).
import { useMemo } from 'react'
import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import type { ProjectPageLayoutProps, SlicerProps } from '@ynput/ayon-addon'
import { Slicer } from '@shared/containers/Slicer/components/Slicer'
import { defaultSliceOptions } from '@shared/containers/Slicer/hooks/useTableDataBySlice'
import useSlicerSplitter from '@shared/containers/Slicer/hooks/useSlicerSplitter'

// panel sizes are shared with the built-in pages (useSlicerSplitter), the selection is per page
// (SlicerProvider page={module} in ProjectPage)
export const ProjectPageLayoutHost = ({ sidebar, children }: ProjectPageLayoutProps) => {
  const [slicerSize, handleResizeEnd] = useSlicerSplitter()
  if (!sidebar) return <>{children}</>

  return (
    <Splitter
      layout="horizontal"
      style={{ width: '100%', height: '100%' }}
      onResizeEnd={handleResizeEnd}
    >
      <SplitterPanel size={slicerSize[0]} style={{ overflow: 'hidden' }}>
        {sidebar}
      </SplitterPanel>
      <SplitterPanel size={slicerSize[1]} style={{ overflow: 'hidden' }}>
        {children}
      </SplitterPanel>
    </Splitter>
  )
}

export const SlicerHost = ({ fields }: SlicerProps) => {
  const fieldsKey = fields.join(',')
  const sliceFields = useMemo(
    () => defaultSliceOptions.filter((field) => fields.includes(field.value)),
    // fields is compared by content: addons pass a new array literal every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fieldsKey],
  )

  return (
    <Section wrap style={{ height: '100%' }}>
      <Slicer sliceFields={sliceFields} pinnedSliceType="hierarchy" />
    </Section>
  )
}

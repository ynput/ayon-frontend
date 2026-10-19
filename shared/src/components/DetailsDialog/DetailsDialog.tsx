import { useState } from 'react'
import { toast } from 'react-toastify'
import { useGetEntityQuery } from '@shared/api'
import { Button, Dialog } from '@ynput/ayon-react-components'
import { JsonViewer } from '@shared/components/JsonViewer'
import { hasTraits, RepresentationTraits } from '@shared/components/RepresentationTraits'
import * as Styled from './DetailsDialog.styled'

export interface DetailsDialogProps {
  projectName?: string
  entityType: string
  entityIds: string[]
  visible: boolean
  onHide: () => void
}

type DetailsTab = 'traits' | 'raw'

export const DetailsDialog = ({
  projectName,
  entityType,
  entityIds,
  visible,
  onHide,
}: DetailsDialogProps) => {
  const [tab, setTab] = useState<DetailsTab>('traits')
  const {
    data = {},
    isLoading,
    isError,
    error,
  } = useGetEntityQuery(
    { projectName, entityType: entityType, entityId: entityIds?.[0] },
    { skip: !visible },
  )

  // Show error toast if the query errored
  if (isError) {
    toast.error(`Unable to load detail. ${error}`)
  }

  // Keep the early return after hooks to ensure hooks are called on every render in the same order
  if (!visible || (Array.isArray(data) ? data.length < 1 : false)) return null

  const traits = entityType === 'representation' && hasTraits(data?.traits) ? data.traits : null

  const renderContent = () => {
    if (isLoading || isError) return <pre>{isLoading ? 'loading...' : 'error...'}</pre>
    if (!traits) return <JsonViewer value={data} />

    return (
      <>
        <Styled.Tabs>
          <Button variant="text" selected={tab === 'traits'} onClick={() => setTab('traits')}>
            Traits
          </Button>
          <Button variant="text" selected={tab === 'raw'} onClick={() => setTab('raw')}>
            Raw
          </Button>
        </Styled.Tabs>
        {tab === 'traits' ? <RepresentationTraits traits={traits} /> : <JsonViewer value={data} />}
      </>
    )
  }

  return (
    <Dialog
      isOpen={true}
      onClose={onHide}
      size="lg"
      style={{ width: '50vw' }}
      header={`${entityType} detail`}
    >
      {renderContent()}
    </Dialog>
  )
}
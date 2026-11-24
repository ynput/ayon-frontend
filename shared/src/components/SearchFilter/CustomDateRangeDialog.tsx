import { FC } from 'react'
import { DateRangeCalendar, Dialog, SaveButton } from '@ynput/ayon-react-components'
import { getDialogKeyDown } from '@shared/util'

interface CustomDateRangeDialogProps {
  isOpen: boolean
  header: string
  startDate: string
  endDate: string
  onStartDateChange: (v: string) => void
  onEndDateChange: (v: string) => void
  onApply: () => void
  onClose: () => void
}

// the first and last day picked on one calendar (two clicks), then confirmed
export const CustomDateRangeDialog: FC<CustomDateRangeDialogProps> = ({
  isOpen,
  header,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onClose,
}) => (
  <Dialog
    isOpen={isOpen}
    onClose={onClose}
    // Enter on a calendar day picks it (it calls preventDefault), otherwise it confirms
    onKeyDown={getDialogKeyDown(onApply, {
      onClose,
      disabled: !(startDate && endDate && endDate >= startDate),
    })}
    header={header}
    size="md"
    style={{ width: 'auto', maxHeight: 'none' }}
    hideCancelButton
    footer={
      <SaveButton
        label="Confirm"
        icon="check"
        onClick={onApply}
        active={!!startDate && !!endDate && endDate >= startDate}
      />
    }
  >
    <DateRangeCalendar
      value={{ from: startDate, to: endDate }}
      onChange={({ from, to }) => {
        onStartDateChange(from)
        onEndDateChange(to)
      }}
    />
  </Dialog>
)

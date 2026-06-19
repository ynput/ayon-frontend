import { FC } from 'react'
import { Dialog, FormRow, InputDate, SaveButton } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { format, parse } from 'date-fns'

const DialogBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

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
    header={header}
    size="sm"
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
    <DialogBody>
      <FormRow label="Start date">
        <InputDate
          {...({
            selected: startDate ? parse(startDate, 'yyyy-MM-dd', new Date()) : undefined,
            onChange: (date: Date | null) =>
              onStartDateChange(date ? format(date, 'yyyy-MM-dd') : ''),
            autoFocus: true,
          } as any)}
        />
      </FormRow>
      <FormRow label="End date">
        <InputDate
          {...({
            selected: endDate ? parse(endDate, 'yyyy-MM-dd', new Date()) : undefined,
            onChange: (date: Date | null) =>
              onEndDateChange(date ? format(date, 'yyyy-MM-dd') : ''),
            openToDate: startDate ? new Date(startDate) : undefined,
          } as any)}
        />
      </FormRow>
    </DialogBody>
  </Dialog>
)

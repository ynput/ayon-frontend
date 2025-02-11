import { usePowerpack } from '@context/powerpackContext'
import { SliceType } from '@context/slicerContext'
import { Dropdown, DropdownProps, DropdownRef } from '@ynput/ayon-react-components'
import { forwardRef } from 'react'
import styled from 'styled-components'

const StyledDropdown = styled(Dropdown)`
  height: 28px;

  .template-value {
    border: 0;

    .icon:not(.control) {
      display: none;
    }
  }

  &.single-option {
    .control {
      display: none;
    }

    .button {
      .template-value {
        cursor: default;
      }
      &:hover {
        background-color: unset;
      }
    }
  }
`

export interface SlicerDropdownProps extends DropdownProps {
  sliceTypes: SliceType[]
}

const SlicerDropdown = forwardRef<DropdownRef, SlicerDropdownProps>(
  ({ sliceTypes, ...props }, ref) => {
    const { setPowerpackDialog } = usePowerpack()

    const options = [...props.options].map((option) => {
      if (option.value === 'hierarchy') return option
      else
        return {
          ...option,
          icon: 'bolt',
        }
    })

    const handleOnChange: DropdownProps['onChange'] = (value, r) => {
      if (value[0] !== 'hierarchy') {
        setPowerpackDialog('slicer')
      }
      props?.onChange?.(['hierarchy'], r)
    }

    return (
      <StyledDropdown
        {...props}
        data-tooltip="Power feature - Slicer"
        data-tooltip-delay={0}
        onChange={handleOnChange}
        options={options}
        ref={ref}
      />
    )
  },
)

export default SlicerDropdown

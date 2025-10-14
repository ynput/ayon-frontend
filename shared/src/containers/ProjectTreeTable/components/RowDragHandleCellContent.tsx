import { Icon } from '@ynput/ayon-react-components'

// Row Drag Handle Cell Content Component
const RowDragHandleCellContent = ({
  attributes,
  listeners,
  disabled = false,
}: {
  attributes?: any
  listeners?: any
  disabled?: boolean
}) => {
  return (
    <button
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
      type="button" // Explicitly set type for button
      title={disabled ? 'Cannot reorder restricted entities' : 'Drag to reorder'}
      disabled={disabled}
      style={{
        cursor: disabled ? 'not-allowed' : 'grab',
        border: 'none',
        background: 'transparent',
        padding: 0,
        display: 'flex', // To center the icon within the button
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%', // Ensure button fills the cell space if needed
        height: '100%',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Icon icon="drag_handle" />
    </button>
  )
}

export default RowDragHandleCellContent

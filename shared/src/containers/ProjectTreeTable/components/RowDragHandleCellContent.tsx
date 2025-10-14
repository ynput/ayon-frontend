import { Icon } from '@ynput/ayon-react-components'

// Row Drag Handle Cell Content Component
const RowDragHandleCellContent = ({
                                    attributes,
                                    listeners,
                                  }: {
  attributes: any
  listeners: any
}) => {
  return (
    <button
      {...attributes}
      {...listeners}
      type="button" // Explicitly set type for button
      title="Drag to reorder"
      style={{
        cursor: 'grab',
        border: 'none',
        background: 'transparent',
        padding: 0,
        display: 'flex', // To center the icon within the button
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%', // Ensure button fills the cell space if needed
        height: '100%',
      }}
    >
      <Icon icon="drag_handle" />
    </button>
  )
}

export default RowDragHandleCellContent

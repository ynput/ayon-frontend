// The slot inspector's Show slots switch and its legend of addons: in AYON's header while developer mode is
// on, and in the addon dev shell. Internal, like slotInspector.
import { useSyncExternalStore } from 'react'
import { InputSwitch } from '@ynput/ayon-react-components'
import { getRegistry, subscribeRegistry } from '@ynput/ayon-addon/host'
import styled from 'styled-components'
import {
  addonColor,
  inspectorAddons,
  setAddonHighlighted,
  setShowSlots,
  useSlotInspector,
} from './slotInspector'

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;
  padding: 4px;
`

const Row = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 8px;
  border-radius: var(--border-radius-m);
  cursor: pointer;
  user-select: none;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }
`

const Legend = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px 0 0;
  border-top: 1px solid var(--md-sys-color-outline-variant);
`

const Hint = styled.span`
  padding: 0 8px;
  color: var(--md-sys-color-outline);
  font-size: 12px;
`

const AddonRow = styled(Row)`
  justify-content: flex-start;
  gap: 8px;
  padding: 2px 8px;
`

const Swatch = styled.span`
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  border-radius: 3px;
`

// the legend follows the addons that register
const getAddons = () => getRegistry().addons
const useAddons = () => {
  useSyncExternalStore(subscribeRegistry, getAddons, getAddons)
  return inspectorAddons()
}

/** Show slots and the addons' colours, each with a checkbox. */
export const SlotInspectorControls = ({ className }: { className?: string }) => {
  const inspector = useSlotInspector()
  const addons = useAddons()
  return (
    <Controls className={className} data-ayon-slot-inspector-controls="">
      <Row title="Every slot shows its example contribution, after the real ones, and every contribution is outlined in the colour of its addon">
        <span>Show slots</span>
        <InputSwitch
          checked={inspector.showSlots}
          onChange={(event) => setShowSlots(event.currentTarget.checked)}
        />
      </Row>
      <Legend>
        <Hint>Addons</Hint>
        {addons.map((addon) => (
          <AddonRow key={addon}>
            <input
              type="checkbox"
              checked={!inspector.hiddenAddons.includes(addon)}
              onChange={(event) => setAddonHighlighted(addon, event.currentTarget.checked)}
            />
            <Swatch style={{ background: addonColor(addon, addons) }} />
            <span>{addon}</span>
          </AddonRow>
        ))}
      </Legend>
    </Controls>
  )
}

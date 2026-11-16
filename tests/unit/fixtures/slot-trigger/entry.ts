// Bundled by slotInspectorTriggers.spec.ts for a page: two addons' entries in a menu slot, and the
// slot inspector that outlines the buttons of the menus by their `data-ayon-trigger` alone.
import * as examples from '../../../../addon/src/examples'
import {
  provideExamples,
  registerManifests,
  setManifestsLoading,
} from '../../../../addon/src/registry'
import {
  setAddonHighlighted,
  setShowSlots,
  setSlotInspectorAvailable,
} from '../../../../shared/src/components/AddonLayout/slotInspector'

const run = () => Promise.resolve({ default: () => undefined })
const manifest = (name: string) => ({
  addon: { name, version: '1.0.0', remote: name },
  manifest: {
    contributes: [{ slot: 'userDetails.menuItem', id: 'log', label: 'Log', icon: 'timer', run }],
  },
})

provideExamples(examples)
setManifestsLoading(false)
registerManifests([manifest('zebra'), manifest('alpha')])
document.body.innerHTML = `
  <button id="menu" data-ayon-trigger="userDetails.menuItem">more</button>
  <button id="empty" data-ayon-trigger="nobody.menuItem">more</button>`
Object.assign(window, { setSlotInspectorAvailable, setShowSlots, setAddonHighlighted })

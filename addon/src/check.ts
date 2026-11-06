// @ynput/ayon-addon/check: the host's manifest rules without React, for tools
// (`ayon-addon check`, `ayon-addon slots`).
export {
  checkManifest,
  checkSlotDeclarations,
  formatSkipped,
  formatSkippedDeclaration,
  ID_PATTERN,
} from './validate'
export type {
  DeclarationCheck,
  DeclaredSlot,
  ManifestCheck,
  SkippedContribution,
  SkippedDeclaration,
} from './validate'
export { SLOTS } from './slots'
export type { SlotDeclaration, SlotDefinition } from './slots'
export { SLOT_DOCS } from './slotDocs'
export type { SlotDoc } from './slotDocs'

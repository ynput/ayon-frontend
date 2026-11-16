// Compiled by addonDeclaredSlots.spec.ts against addon/dist/types: an unused @ts-expect-error fails.
import './exampleContract'
import './anotherContract'
import { useSlot } from '@ynput/ayon-addon'
import type { Contribution, EntityRef, SlotName, SlotProps } from '@ynput/ayon-addon'
import { contribute, defineAddon } from '@ynput/ayon-addon/manifest'

const run = () => Promise.resolve({ default: (context: { entities: EntityRef[] }) => void context.entities })
const component = () =>
  Promise.resolve({ default: ({ projectName }: SlotProps<'example.panel'>) => projectName })

export const manifest = defineAddon({
  contributes: [
    contribute('example.itemMenuItem', { id: 'a', label: 'A', icon: 'x', run }),
    contribute('another.cardMenuItem', {
      id: 'b',
      label: 'B',
      icon: 'x',
      run: () => Promise.resolve({ default: (context: { cardId: string }) => void context.cardId }),
    }),
    contribute('example.panel', { id: 'c', title: 'C', component }),
    contribute('project.page', { id: 'p', title: 'P', component: () => Promise.resolve({ default: () => null }) }),
  ],
})

export const names: SlotName[] = ['example.itemMenuItem', 'another.cardMenuItem', 'example.panel', 'project.page']
export type ExampleEntities = SlotProps<'example.itemMenuItem'>['entities']
export type AnotherCard = SlotProps<'another.cardMenuItem'>['cardId']
export type ExampleRun = Contribution<'example.itemMenuItem'>['run']
export type PanelId = Contribution<'example.panel'>['id']
export const useEntities = () => useSlot('example.itemMenuItem').entities

// @ts-expect-error a slot in neither package
export const unknownName: SlotName = 'nope.slot'
// @ts-expect-error a slot in neither package
contribute('nope.slot', { id: 'a' })
// @ts-expect-error missing label
contribute('example.itemMenuItem', { id: 'a', icon: 'x', run })
// @ts-expect-error missing id, though the slot's meta doesn't list it
contribute('example.panel', { title: 'C', component })
contribute('example.itemMenuItem', {
  id: 'a',
  label: 'A',
  icon: 'x',
  // @ts-expect-error a wrong run signature
  run: () => Promise.resolve({ default: (context: number) => void context }),
})

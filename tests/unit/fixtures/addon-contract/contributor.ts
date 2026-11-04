// Compiled by addonDeclaredSlots.spec.ts against addon/dist/types: an unused @ts-expect-error fails.
import './plannerContract'
import './reviewContract'
import { useSlot } from '@ynput/ayon-addon'
import type { Contribution, EntityRef, SlotName, SlotProps } from '@ynput/ayon-addon'
import { contribute, defineAddon } from '@ynput/ayon-addon/manifest'

const run = () => Promise.resolve({ default: (context: { entities: EntityRef[] }) => void context.entities })

export const manifest = defineAddon({
  contributes: [
    contribute('planner.eventMenuItem', { id: 'a', label: 'A', icon: 'x', run }),
    contribute('review.cardMenuItem', {
      id: 'b',
      label: 'B',
      icon: 'x',
      run: () => Promise.resolve({ default: (context: { cardId: string }) => void context.cardId }),
    }),
    contribute('project.page', { id: 'p', title: 'P', component: () => Promise.resolve({ default: () => null }) }),
  ],
})

export const names: SlotName[] = ['planner.eventMenuItem', 'review.cardMenuItem', 'project.page']
export type PlannerEntities = SlotProps<'planner.eventMenuItem'>['entities']
export type ReviewCard = SlotProps<'review.cardMenuItem'>['cardId']
export type PlannerRun = Contribution<'planner.eventMenuItem'>['run']
export const useEntities = () => useSlot('planner.eventMenuItem').entities

// @ts-expect-error a slot in neither package
export const unknownName: SlotName = 'nope.slot'
// @ts-expect-error a slot in neither package
contribute('nope.slot', { id: 'a' })
// @ts-expect-error missing label
contribute('planner.eventMenuItem', { id: 'a', icon: 'x', run })
contribute('planner.eventMenuItem', {
  id: 'a',
  label: 'A',
  icon: 'x',
  // @ts-expect-error a wrong run signature
  run: () => Promise.resolve({ default: (context: number) => void context }),
})

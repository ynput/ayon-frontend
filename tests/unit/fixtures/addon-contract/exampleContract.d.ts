// what a contract package's types do
import type { ComponentType } from 'react'
import type { EntityRef, Loader, MenuItemMeta, RunPiece, SlotProps } from '@ynput/ayon-addon'

declare module '@ynput/ayon-addon' {
  interface SlotMap {
    'example.itemMenuItem': {
      version: 1
      meta: MenuItemMeta
      context: { projectName: string; entities: EntityRef[] }
      pieces: { run: Loader<RunPiece<'example.itemMenuItem'>> }
    }
    // a meta without `id`: every contribution has one anyway
    'example.panel': {
      version: 1
      meta: { title: string }
      context: { projectName: string }
      pieces: { component: Loader<ComponentType<SlotProps<'example.panel'>>> }
    }
  }
}

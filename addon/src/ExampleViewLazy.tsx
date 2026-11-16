import type { ExampleViewProps } from './ExampleView'
import { usePiece } from './pieces'

// loaded when first rendered: only examples render it
const load = () => import('./ExampleView')

/**
 * The default content of an example contribution (see `SlotDeclaration.example`): the slot it is
 * in and the context it got, keys and short values. An owner's own example component renders it
 * inside its own with its props, `inline` in a small place:
 *
 * ```tsx
 * const BadgeExample = (props: SlotProps<'example.cardBadge'>) => <ExampleView {...props} inline />
 * ```
 */
export const ExampleView = (props: ExampleViewProps) => {
  const { value: View } = usePiece(load)
  return View ? <View {...props} /> : null
}

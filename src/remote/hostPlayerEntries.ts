// Every @ynput/ayon-player entry, loaded together the first time an addon asks for one (see
// hostSharedModules.ts). Addon player plugins (e.g. Review's compare and timeline) read the
// player's React contexts and hooks, so they must use the same copy as the host's <Player>.
// One per "exports" entry in @ynput/ayon-player's package.json, except the stylesheet.
import * as index from '@ynput/ayon-player'
import * as plugins from '@ynput/ayon-player/plugins'
import * as model from '@ynput/ayon-player/model'
import * as utils from '@ynput/ayon-player/utils'
import * as attributes from '@ynput/ayon-player/attributes'
import * as color from '@ynput/ayon-player/color'

export const entries: Record<string, unknown> = {
  '': index,
  '/plugins': plugins,
  '/model': model,
  '/utils': utils,
  '/attributes': attributes,
  '/color': color,
}

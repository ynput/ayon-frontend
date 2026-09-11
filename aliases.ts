import { fileURLToPath, URL } from 'url'

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export const aliases = [
  { find: '@', replacement: local('./src') },
  { find: '@containers', replacement: local('./src/containers') },
  { find: '@hooks', replacement: local('./src/hooks') },
  { find: '@components', replacement: local('./src/components') },
  { find: '@api', replacement: local('./src/api') },
  { find: '@types', replacement: local('./src/types') },
  { find: '@queries', replacement: local('./src/services') },
  { find: '@pages', replacement: local('./src/pages') },
  { find: '@context', replacement: local('./src/context') },
  { find: '@state', replacement: local('./src/features') },
  { find: '@helpers', replacement: local('./src/helpers') },
  { find: '@shared', replacement: local('./shared/src') },
  // @ynput/ayon-player externalises these — point them at the local shared source
  // so the player shares our React contexts instead of getting a second copy
  {
    find: '@ynput/ayon-frontend-shared/ContextMenu',
    replacement: local('./shared/src/containers/ContextMenu'),
  },
  { find: '@ynput/ayon-frontend-shared/Feed', replacement: local('./shared/src/containers/Feed') },
  { find: '@ynput/ayon-frontend-shared/api', replacement: local('./shared/src/api') },
  { find: '@ynput/ayon-frontend-shared/components', replacement: local('./shared/src/components') },
  { find: '@ynput/ayon-frontend-shared/context', replacement: local('./shared/src/context') },
]

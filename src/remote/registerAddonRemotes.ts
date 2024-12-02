// register each remote addon here

import { registerRemotes } from '@module-federation/enhanced/runtime'

export type RemoteType = 'slicer'
type Remote = {
  remote: RemoteType
  addon?: string // if different to remote
  version: string
  type?: string // default is module
}

const remotes: Remote[] = [
  {
    remote: 'slicer',
    version: '0.0.1',
  },
]

const registerAddonRemotes = () => {
  console.log('registerAddonRemotes')
  registerRemotes(
    remotes.map((r) => ({
      name: r.remote,
      alias: r.remote,
      entry: `/addons/${r.addon || r.remote}/${r.version}/frontend/modules/${
        r.remote
      }/remoteEntry.js?date=${new Date().toISOString()}`,
      type: r.type || 'module',
    })),
  )
}

export default registerAddonRemotes

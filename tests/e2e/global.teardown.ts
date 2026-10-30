import { ayonTeardown } from '@ynput/ayon-e2e'
import { AyonApi } from './support/api'

// leftover projects, users and access groups of this run, plus the studio-wide data tests create
export default ayonTeardown({
  Client: AyonApi,
  sweep: async (api, prefix) => {
    for (const secret of await api.listSecretNames()) {
      if (secret.startsWith(prefix)) await api.deleteSecret(secret)
    }
    for (const preset of await api.listAnatomyPresets()) {
      if (preset.name.startsWith(prefix)) await api.deleteAnatomyPreset(preset.name)
    }
  },
})

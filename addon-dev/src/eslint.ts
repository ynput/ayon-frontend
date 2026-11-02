// Lint preset for addon frontends: imports that would bypass AYON's own copies.
//   import { ayonAddonLint } from '@ynput/ayon-addon-dev/eslint'
//   export default defineConfig([..., ...ayonAddonLint])
const viaAddonApi = (name: string, what: string) => ({
  name,
  message: `Import ${what} from @ynput/ayon-addon: it is AYON's copy, so it works in every slot.`,
})

export const ayonAddonLint = [
  {
    name: 'ayon-addon/imports',
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            viaAddonApi('react-router-dom', 'the router hooks and Link'),
            viaAddonApi('react-router', 'the router hooks and Link'),
            viaAddonApi('react-toastify', 'toast'),
            {
              name: '@ynput/ayon-addon/host',
              message: '@ynput/ayon-addon/host is for AYON itself, not for addons.',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'ayon-addon/manifest',
    files: ['**/manifest.{ts,tsx,js}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@ynput/ayon-addon',
              message:
                'The manifest imports from @ynput/ayon-addon/manifest (bundled into the addon), so it loads on older AYON versions too.',
            },
          ],
        },
      ],
    },
  },
]

export default ayonAddonLint

import { expect, test } from '@playwright/test'
import {
  getAddonChanges,
  resolveBundleAddons,
} from '../../shared/src/context/remote-modules/bundleAddons'

const addon = (
  name: string,
  versions: { productionVersion?: string; stagingVersion?: string },
  scopes: Record<string, object> = {},
) =>
  ({
    name,
    title: name,
    description: '',
    ...versions,
    versions: Object.fromEntries(
      Object.values(versions).map((version) => [version, { frontendScopes: scopes }]),
    ),
  }) as any

const module = (addonName: string, addonVersion: string) =>
  ({ addonName, addonVersion, modules: { [addonName]: ['Project'] } }) as any

const devBundle = (activeUser: string, addons: Record<string, string>) =>
  ({ name: 'dev', isDev: true, activeUser, addons }) as any

const addons = [
  addon('planner', { productionVersion: '1.0.0', stagingVersion: '2.0.0' }),
  addon('only_prod', { productionVersion: '1.0.0' }),
]

test.describe('resolveBundleAddons', () => {
  test('uses the version of the bundle mode', () => {
    expect(resolveBundleAddons(addons, [], 'production')).toEqual({
      variant: 'production',
      versions: { planner: '1.0.0', only_prod: '1.0.0' },
    })
    expect(resolveBundleAddons(addons, [], 'staging')).toEqual({
      variant: 'staging',
      versions: { planner: '2.0.0' },
    })
  })

  test("developer mode uses the user's own dev bundle, else production", () => {
    const bundles = [devBundle('me', { planner: '3.0.0' })]
    expect(resolveBundleAddons(addons, bundles, 'developer', 'me')).toEqual({
      variant: 'developer',
      versions: { planner: '3.0.0' },
    })
    expect(resolveBundleAddons(addons, bundles, 'developer', 'someone').variant).toBe('production')
  })
})

test.describe('getAddonChanges', () => {
  const unchanged = { modules: [module('planner', '1.0.0')] }

  test('nothing changed', () => {
    expect(getAddonChanges(unchanged, { ...unchanged, addons: [] })).toEqual([])
  })

  test('reports modules added, removed and in another version', () => {
    expect(
      getAddonChanges(unchanged, { modules: [module('planner', '2.0.0')], addons: [] }),
    ).toEqual(['planner 2.0.0'])
    expect(getAddonChanges(unchanged, { modules: [], addons: [] })).toEqual(['planner removed'])
    expect(
      getAddonChanges(
        { modules: [] },
        { modules: [module('planner', '1.0.0')], addons: [] },
      ),
    ).toEqual(['planner 1.0.0'])
  })

  test('reports classic addon pages, ignores addons with no frontend', () => {
    const live = [
      addon('classic', { productionVersion: '1.0.0' }, { project: {} }),
      addon('server_only', { productionVersion: '1.0.0' }),
    ]
    const bundle = (versions: Record<string, string>) =>
      ({ variant: 'production', versions }) as const

    expect(
      getAddonChanges(
        { modules: [], bundle: bundle({ classic: '1.0.0', server_only: '1.0.0' }) },
        { modules: [], bundle: bundle({}), addons: live },
      ),
    ).toEqual(['classic removed'])
  })

  test('an addon in both lists is reported once', () => {
    const live = [addon('planner', { productionVersion: '1.0.0' }, { project: {} })]
    expect(
      getAddonChanges(
        {
          modules: [module('planner', '1.0.0')],
          bundle: { variant: 'production', versions: { planner: '1.0.0' } },
        },
        { modules: [], bundle: { variant: 'production', versions: {} }, addons: live },
      ),
    ).toEqual(['planner removed'])
  })
})

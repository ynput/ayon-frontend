import { expect, test } from '@playwright/test'
import { buildEntityUri, parseUri } from '../../shared/src/util/uriUtils'
import { extractVersionFromFilename } from '../../shared/src/util/extractVersionFromFilename'

test.describe('ayon uris', () => {
  test('entity uris carry the task, product and version as query parameters', () => {
    expect(
      buildEntityUri({ projectName: 'demo', folderPath: 'shots/sh010', taskName: 'comp' }),
    ).toBe('ayon+entity://demo/shots/sh010?task=comp')
    expect(
      buildEntityUri({
        projectName: 'demo',
        folderPath: '/assets/hero',
        productName: 'modelMain',
        versionName: 'v003',
      }),
    ).toBe('ayon+entity://demo//assets/hero?product=modelMain&version=v003')
  })

  test('an entity uri parses back to the same entity, typed by its most specific part', () => {
    const entities: [Parameters<typeof buildEntityUri>[0], string][] = [
      [{ projectName: 'demo', folderPath: '/shots/sh010' }, 'folder'],
      [{ projectName: 'demo', folderPath: '/shots/sh010', taskName: 'comp' }, 'task'],
      [
        {
          projectName: 'demo',
          folderPath: '/shots/sh010',
          taskName: 'comp',
          productName: 'renderMain',
        },
        'product',
      ],
      [
        {
          projectName: 'demo',
          folderPath: '/shots/sh010',
          taskName: 'comp',
          productName: 'renderMain',
          versionName: 'v001',
        },
        'version',
      ],
    ]
    for (const [entity, entityType] of entities) {
      expect.soft(parseUri(buildEntityUri(entity)), entityType).toEqual({
        type: 'entity',
        entity: { ...entity, entityType },
      })
    }
  })

  test('settings uris give the addon, version, settings path, project and site', () => {
    expect(
      parseUri('ayon+settings://core:1.2.3/publish/ValidateFrameRange?project=demo&site=ws01'),
    ).toEqual({
      type: 'settings',
      settings: {
        addonName: 'core',
        addonVersion: '1.2.3',
        settingsPath: ['publish', 'ValidateFrameRange'],
        project: 'demo',
        site: 'ws01',
      },
    })
    expect(parseUri('ayon+settings://core:1.2.3')).toEqual({
      type: 'settings',
      settings: { addonName: 'core', addonVersion: '1.2.3', settingsPath: [] },
    })
  })

  test('other uris have no type', () => {
    for (const uri of ['', 'https://ayon.app', 'ayon://demo/shots', 'ayon+entity:/demo']) {
      expect.soft(parseUri(uri), uri).toEqual({ type: undefined })
    }
  })
})

test.describe('version number from a file name', () => {
  test('common version patterns are recognised', () => {
    const versions: [string, number][] = [
      ['sh010_comp_v003.exr', 3],
      ['sh010_v012_comp.mov', 12],
      ['review-v7 final.mp4', 7],
      ['sh010_v001_v004.exr', 4],
      ['render_042.png', 42],
      ['plate_0012_denoised.exr', 12],
      ['001_plate.exr', 1],
      ['heroV2.ma', 2],
      ['my.file.v002.exr', 2],
      ['render0042.exr', 42],
      ['sh010_v001', 1],
    ]
    for (const [filename, version] of versions) {
      expect.soft(extractVersionFromFilename(filename), filename).toBe(version)
    }
  })

  test('names without a positive version number give no version', () => {
    for (const filename of [
      'image.png',
      'comp_v0.mov',
      'final_v000.exr',
      'shot1.exr',
      '',
      '.exr',
    ]) {
      expect.soft(extractVersionFromFilename(filename), filename).toBeNull()
    }
  })
})

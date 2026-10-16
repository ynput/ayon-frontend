import type { ListValuesModule } from './types'

type Rules = Pick<ListValuesModule, 'resolveValues' | 'getEditTarget'>

// Used without the powerpack: the table shows and edits the entities' values,
// only the list's own attributes are read from and written to the list items.
export const communityListValueRules: Rules = {
  resolveValues: (sources, { listAttributes }) => {
    const listOwn = listAttributes.filter((name) => name in sources.listAttrib)
    const attrib = { ...sources.entityAttrib }
    for (const name of listOwn) attrib[name] = sources.listAttrib[name]
    return { attrib, ownAttrib: [...sources.entityOwnAttrib, ...listOwn], marks: {} }
  },
  getEditTarget: (attrib, { listAttributes }) =>
    listAttributes.includes(attrib) ? 'listItem' : 'entity',
}

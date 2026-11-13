// Palettes a list of types, statuses or tags can take its colours from. All are published
// qualitative (categorical) palettes, made so that neighbouring colours are told apart:
// - Tableau 10, Tableau's default categorical palette (values as in d3-scale-chromatic)
// - Okabe-Ito, the colour-blind safe set (Okabe and Ito 2008, popularised by Wong 2011,
//   Nature Methods 8:441). Its black is left out: it vanishes on the dark theme
// - ColorBrewer Set1, Set2, Dark2, Pastel1 and Paired (Cynthia Brewer, colorbrewer2.org)
// The values are data written to the settings (hex, like the colour field), not styling.
export type ColorScheme = {
  id: string
  label: string
  colors: string[]
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'tableau10',
    label: 'Tableau 10',
    colors: [
      '#4e79a7',
      '#f28e2c',
      '#e15759',
      '#76b7b2',
      '#59a14f',
      '#edc949',
      '#af7aa1',
      '#ff9da7',
      '#9c755f',
      '#bab0ab',
    ],
  },
  {
    id: 'okabe-ito',
    label: 'Okabe-Ito (color-blind safe)',
    colors: ['#e69f00', '#56b4e9', '#009e73', '#f0e442', '#0072b2', '#d55e00', '#cc79a7'],
  },
  {
    id: 'brewer-set1',
    label: 'ColorBrewer Set1',
    colors: [
      '#e41a1c',
      '#377eb8',
      '#4daf4a',
      '#984ea3',
      '#ff7f00',
      '#ffff33',
      '#a65628',
      '#f781bf',
      '#999999',
    ],
  },
  {
    id: 'brewer-set2',
    label: 'ColorBrewer Set2',
    colors: [
      '#66c2a5',
      '#fc8d62',
      '#8da0cb',
      '#e78ac3',
      '#a6d854',
      '#ffd92f',
      '#e5c494',
      '#b3b3b3',
    ],
  },
  {
    id: 'brewer-dark2',
    label: 'ColorBrewer Dark2',
    colors: [
      '#1b9e77',
      '#d95f02',
      '#7570b3',
      '#e7298a',
      '#66a61e',
      '#e6ab02',
      '#a6761d',
      '#666666',
    ],
  },
  {
    id: 'brewer-pastel1',
    label: 'ColorBrewer Pastel1',
    colors: [
      '#fbb4ae',
      '#b3cde3',
      '#ccebc5',
      '#decbe4',
      '#fed9a6',
      '#ffffcc',
      '#e5d8bd',
      '#fddaec',
      '#f2f2f2',
    ],
  },
  {
    id: 'brewer-paired',
    label: 'ColorBrewer Paired',
    colors: [
      '#a6cee3',
      '#1f78b4',
      '#b2df8a',
      '#33a02c',
      '#fb9a99',
      '#e31a1c',
      '#fdbf6f',
      '#ff7f00',
      '#cab2d6',
      '#6a3d9a',
      '#ffff99',
      '#b15928',
    ],
  },
]

export const DEFAULT_COLOR_SCHEME = COLOR_SCHEMES[0].id

export const getColorScheme = (id?: string) =>
  COLOR_SCHEMES.find((scheme) => scheme.id === id) ?? COLOR_SCHEMES[0]

const shuffled = <T>(items: T[], random: () => number): T[] => {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * `count` colours from a scheme in random order. Every colour is used once before any
 * repeats, and a colour never follows itself where the scheme has a second one.
 */
export const pickSchemeColors = (
  scheme: ColorScheme,
  count: number,
  random: () => number = Math.random,
): string[] => {
  const picked: string[] = []
  while (picked.length < count) {
    let round = shuffled(scheme.colors, random)
    if (round.length > 1 && round[0] === picked[picked.length - 1])
      round = round.slice(1).concat(round[0])
    picked.push(...round)
  }
  return picked.slice(0, count)
}

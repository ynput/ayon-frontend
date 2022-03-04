const SYNC_STATES = [
  { name: 'N/A', value: -1 },
  { name: 'In progress', value: 0 },
  { name: 'Queued', value: 1 },
  { name: 'Failed', value: 2 },
  { name: 'Paused', value: 3 },
  { name: 'Synced', value: 4 },
]

const formatStatus = (value) => {
  const cell = {
    '-1': { label: 'N/A', color: 'red' },
    0: { label: 'In progress', color: '#dddd11' },
    1: { label: 'Queued', color: '#ccccff' },
    2: { label: 'Failed', color: 'red' },
    3: { label: 'Paused', color: '#0012ff' },
    4: { label: 'Synced', color: '#00ffaa' },
  }[value]
  if (!cell) return <span>{value}</span>
  return <span style={{ color: cell.color }}>{cell.label}</span>
}

export { SYNC_STATES, formatStatus }

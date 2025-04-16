const getSequence = (start: string, next: string, length: number): string[] => {
  // Extract the numeric parts from the 'start' and 'next' strings
  const startMatch = start.match(/\d+$/)
  const nextMatch = next.match(/\d+$/)
  const startNumber = startMatch ? parseInt(startMatch[0], 10) : NaN
  const nextNumber = nextMatch ? parseInt(nextMatch[0], 10) : NaN

  // Calculate the difference between the last numbers
  const difference = nextNumber - startNumber

  if (isNaN(difference)) return []

  // Initialize an array to store the sequence
  const sequence: string[] = []

  // Generate the sequence based on the difference and length
  for (let i = 0; i < length; i++) {
    const currentNumber = startNumber + i * difference
    const matchResult = start.match(/\d+$/)
    if (!matchResult) return []

    const paddedNumber = String(currentNumber).padStart(matchResult[0].length, '0')
    const sequenceItem = start.replace(/\d+$/, paddedNumber)
    sequence.push(sequenceItem)
  }

  return sequence
}

export default getSequence

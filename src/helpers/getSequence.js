const getSequence = (start, next, length) => {
  // Extract the numeric parts from the 'start' and 'next' strings
  const startNumber = parseInt((start.match(/\d+$/) || [])[0], 10)
  const nextNumber = parseInt((next.match(/\d+$/) || [])[0], 10)

  // Calculate the difference between the last numbers
  const difference = nextNumber - startNumber

  if (isNaN(difference)) return []

  // Initialize an array to store the sequence
  const sequence = []

  // Generate the sequence based on the difference and length
  for (let i = 0; i < length; i++) {
    const currentNumber = startNumber + i * difference
    const paddedNumber = String(currentNumber).padStart(start.match(/\d+$/)[0].length, '0')
    const sequenceItem = start.replace(/\d+$/, paddedNumber)
    sequence.push(sequenceItem)
  }

  return sequence
}

export default getSequence

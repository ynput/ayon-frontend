// set number or random number between 2-6
export const getFakeTasks = (number) =>
  Array.from({ length: number || Math.floor(Math.random() * (6 - 2 + 1)) + 2 }, (_, index) => ({
    id: index,
    isLoading: true,
  }))

export default getFakeTasks

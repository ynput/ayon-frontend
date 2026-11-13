import { toast } from 'react-toastify'

/** The `run` piece of an example contribution: it only says so. */
const runExample = ({ slot }: { slot: string }) => {
  toast.info(`Example contribution to ${slot}`, { toastId: `ayon-example:${slot}` })
}

export default runExample

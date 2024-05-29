// return a random folder name
import { compareAsc } from 'date-fns'

const paths = {
  // folders
  folders: [
    'sh020',
    'sh030',
    'sh040',
    'sh050',
    'sh060',
    'chair',
    'bin',
    'robot',
    'ep101sq001sh010',
    'ep101sq001sh070',
    'ep104sq001sh070',
  ],
  // products
  products: [
    'animationChar1',
    'cameraMain',
    'renderFxFire',
    'renderFxSmoke',
    'renderLightingBG',
    'renderLightingBG_crypto',
    'renderLightingBG_crypto',
    'reviewFxFire',
    'vdbcacheFire',
  ],
}

export const transformInboxMessages = (messageEdges = [], { important = false, active = true }) => {
  const messages = []
  const projectNames = []

  for (const messageEdge of messageEdges) {
    const message = messageEdge.node

    if (!message) continue

    const entityType = message.origin?.type

    const randomFolder = paths.folders[Math.floor(Math.random() * paths.folders.length)]
    const randomProduct = paths.products[Math.floor(Math.random() * paths.products.length)]

    let path = [message.origin?.name]
    if (entityType === 'task') {
      // add a random folder name to the start
      path = [randomFolder, ...path]
    } else if (entityType === 'version') {
      // add a random product and folder name to the start
      path = [randomProduct, randomProduct, ...path]
    }

    const transformedMessage = {
      ...message,
      folderName: '',
      thumbnail: { icon: 'folder' },
      entityId: message.origin?.id,
      entityType: entityType,
      important: important,
      path: path, //HACK: path will be provided by the backend
    }

    // parse fields that are JSON strings
    const jsonFields = ['activityData']

    jsonFields.forEach((field) => {
      if (transformedMessage[field]) {
        try {
          transformedMessage[field] = JSON.parse(transformedMessage[field])
        } catch (e) {
          console.error('Error parsing JSON field', field, transformedMessage[field])
        }
      }
    })

    messages.push(transformedMessage)

    // extract project and add to projectNames if not already there
    if (message.projectName && !projectNames.includes(message.projectName)) {
      projectNames.push(message.projectName)
    }
  }

  //   now sort the messages by createdAt using the compare function
  const messagesSortedByDate = messages.sort((a, b) =>
    active ? compareAsc(new Date(b.createdAt), new Date(a.createdAt)) : messages,
  )

  return { projectNames, messages: messagesSortedByDate }
}

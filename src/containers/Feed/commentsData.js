import { v4 as uuid4 } from 'uuid'

const tasks = [
  {
    id: '739af4b83da311eeac5d0242ac120004',
    name: 'modeling',
    folder: '00_kloecksiouys_mccrietsoiwn',
  },
  { id: '74b042ae3da311eeac5d0242ac120004', name: 'matchmove', folder: 'sh040' },
  { id: '7463af163da311eeac5d0242ac120004', name: 'lighting', folder: 'sh030' },
  { id: '7463016a3da311eeac5d0242ac120004', name: 'animation', folder: 'sh030' },
  {
    id: '73a047243da311eeac5d0242ac120004',
    name: 'texture',
    folder: '00_kloecksiouys_mccrietsoiwn',
  },
  { id: '746356883da311eeac5d0242ac120004', name: 'fx', folder: 'sh030' },
  { id: '74ff1a1e3da311eeac5d0242ac120004', name: 'fx', folder: 'sh050' },
]

const versions = [
  { id: '73c9635c3da311eeac5d0242ac120004', name: 'renderCompositingMain' },
  { id: '74c1ae043da311eeac5d0242ac120004', name: 'renderAnimationLookDev' },
  { id: '73c080f23da311eeac5d0242ac120004', name: 'renderMatchmove' },
  { id: '743f25f63da311eeac5d0242ac120004', name: 'renderLighting' },
]

const users = [
  {
    name: 'admin',
    fullName: 'Admin',
  },
  {
    name: 'demouser10',
    fullName: 'Demo 10',
  },
  {
    name: 'demouser20',
    fullName: 'Demo 20',
  },
  {
    name: 'demouser30',
    fullName: 'Demo 30',
  },
]

const getRandomImage = () => {
  const width = Math.floor(Math.random() * 800) + 200
  const height = Math.floor(Math.random() * 700) + 300
  return `https://picsum.photos/${width}/${height}`
}

const getRandomAttachmentType = () => {
  const types = ['image', 'file']
  const randomIndex = Math.floor(Math.random() * types.length)
  return types[randomIndex]
}

const getRandomFileName = () => {
  const names = [
    'model.fbx',
    'model.obj',
    'model.mb',
    'model.ma',
    'model.fbx',
    'shot_001.mov',
    'shot_002.mov',
    'shot_003.mov',
    'shot_004.mov',
    'shot_005.mov',
    'shot_006.mov',
    'shot_007.mov',
  ]

  const randomIndex = Math.floor(Math.random() * names.length)
  return names[randomIndex]
}

const getRandomAttachments = () => {
  const shouldReturnAttachments = Math.random() < 0.5

  if (!shouldReturnAttachments) return []

  const numberOfAttachments = Math.floor(Math.random() * 2) + 1

  const attachments = []

  for (let i = 0; i < numberOfAttachments; i++) {
    attachments.push({
      id: uuid4(),
      url: getRandomImage(),
      type: getRandomAttachmentType(),
      name: getRandomFileName(),
    })
  }

  return attachments
}

const getRandomDateInLastWeek = () => {
  const now = new Date()
  const lastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  const timeDiff = now.getTime() - lastWeek.getTime()
  const randomTime = Math.random() * timeDiff
  const randomDate = new Date(lastWeek.getTime() + randomTime)
  return randomDate
}

const getRandomTaskId = () => {
  const randomIndex = Math.floor(Math.random() * tasks.length)
  return tasks[randomIndex]
}

const getRandomVersionId = () => {
  const randomIndex = Math.floor(Math.random() * versions.length)
  return versions[randomIndex]
}

const getRandomUser = () => {
  const randomIndex = Math.floor(Math.random() * users.length)
  return users[randomIndex]
}

const getTaskRef = () => {
  const task = getRandomTaskId()

  return {
    id: uuid4(),
    refId: task.id,
    label: task.name,
    folder: task.folder,
    refType: 'task',
  }
}

const getVersionRef = () => {
  const version = getRandomVersionId()

  return {
    id: uuid4(),
    refId: version.id,
    label: version.name,
    refType: 'version',
  }
}

const getUserRef = () => {
  const user = getRandomUser()
  return {
    id: uuid4(),
    refId: user.name,
    refType: 'user',
    label: user.fullName,
  }
}

const createRef = (type) => {
  switch (type) {
    case '@user':
      return getUserRef()
    case '@version':
      return getVersionRef()
    case '@task':
      return getTaskRef()

    default:
      return getTaskRef()
  }
}

const getRandomComment = (body = '') => {
  const task = getRandomTaskId()

  const comment = {
    id: uuid4(),
    author: getRandomUser().name,
    createdAt: getRandomDateInLastWeek(),
    entityId: task.id,
    entityName: task.name,
    entityFolder: task.folder,
    entityType: 'task',
    eventType: 'comment',
    attachments: getRandomAttachments(),
  }

  const references = []

  // based on the comments references, we can add a body
  // @user @@version @@@task
  // inside of the body string @[ref_label] replaced with @[ref_label](refId) from the references array

  //   create references based on the body
  const bodyRefs = body.match(/@\w+/g)
  if (bodyRefs) {
    bodyRefs.forEach((ref) => {
      const reference = createRef(ref)

      references.push(reference)
    })
  }

  const refTypes = {
    user: '@',
    version: '@@',
    task: '@@@',
  }

  //   update the body with the references
  let updatedBody = body
  references.forEach((ref) => {
    updatedBody = updatedBody.replace(
      refTypes[ref.refType] + ref.refType,
      `[${refTypes[ref.refType]}${ref.label}](${ref.id})`,
    )
  })

  return {
    ...comment,
    body: updatedBody,
    references,
  }
}

const commentBases = [
  {
    body: 'This shot is looking great, but we need to fix the lighting. Can you take a look, @@@task?',
  },
  {
    body: 'I noticed a mistake in the animation for this shot. Can you fix it, @@@task?',
  },
  {
    body: 'This version is looking good, but we need to add some more detail to the textures. Can you work on that, @@version, @user?',
  },
  {
    body: 'I am going to approve @@version because it looks better than @@version. Great work, @user!',
  },
  {
    body: 'We need to get the model from @@@task before we can start working on this shot. Can you help with that, @user?',
  },
  {
    body: 'Great job on the lighting in @@version for this shot! It is looking fantastic, but we could use some minor adjustments. Can you take a look?',
  },
  {
    body: 'Hey @user, I noticed a mistake in the animation for @@version of this shot. Could you lend your expertise and fix it?',
  },
  {
    body: 'Kudos to the team! This version of the scene is impressive, but we should add more detail to the textures in @@version . @user, can you work on that?',
  },
  {
    body: 'I am going to approve @@version because it looks better than the previous one. Great work, @user!',
  },
  {
    body: 'We need to get the model from @@@task before we can start working on @@version of this shot. Can you help with that, @user?',
  },
  {
    body: '@@version of the explosion needs more realistic particle effects. Can you enhance them, @@@task?',
  },
  {
    body: 'The camera angle in @@version of this scene feels awkward. Can we reposition it, @user?',
  },
  {
    body: 'We are missing some sound effects in @@version of this sequence. Can you add them in, @user?',
  },
  {
    body: 'The motion blur on the fast-moving character in @@version needs fine-tuning. Can you address that, @@@task?',
  },
  {
    body: 'The CGI integration for @@version of the creature looks unnatural. Can you make it blend better, @user?',
  },

  {
    body: 'The color correction in @@version of this shot needs adjustment. Can you refine it?',
  },
  {
    body: 'Please check the scale of the props in @@version. It seems a bit off, @user.',
  },
  {
    body: 'The pacing in this sequence feels rushed. We might need to extend some shots, @@version.',
  },
  {
    body: 'The atmospheric effects in @@version are spot on! Great work, but lets optimize render times, @user.',
  },
  {
    body: 'We are missing some keyframe animation in @@version. Can you fill in the gaps, @user?',
  },
  {
    body: 'The composition in @@version for this scene is excellent, but the camera shake is too intense. Can we tone it down, @user?',
  },
  {
    body: 'In @@version, the characters facial expressions do not match the dialogue. Can you sync them up?',
  },
  {
    body: 'The background matte painting in @@version is impressive, but the lighting clashes with the foreground. Can you adjust it?',
  },
  {
    body: 'This version is almost there, but the motion blur feels excessive in @@version. Can you fine-tune it, @user?',
  },
  {
    body: 'The overall pacing in @@version of this sequence is excellent, and the sound effects are on point. Kudos to the team!',
  },
]

const comments = commentBases.map(({ body }) => getRandomComment(body))

export default comments

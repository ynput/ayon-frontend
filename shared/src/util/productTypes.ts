export type ProductTypes = {
  [key: string]: { name: string; icon: string }
}

const productTypes: ProductTypes = {
  image: { name: 'image', icon: 'imagesmode' },
  render: { name: 'render', icon: 'photo_library' },
  review: { name: 'review', icon: 'photo_library' },
  plate: { name: 'plate', icon: 'camera_roll' },
  camera: { name: 'camera', icon: 'videocam' },
  model: { name: 'model', icon: 'language' },
  texture: { name: 'texture', icon: 'texture' },
  look: { name: 'look', icon: 'ev_shadow' },
  rig: { name: 'rig', icon: 'accessibility' },
  animation: { name: 'animation', icon: 'directions_run' },
  cache: { name: 'cache', icon: 'animation' },
  layout: { name: 'layout', icon: 'nature_people' },
  setdress: { name: 'setdress', icon: 'forest' },
  groom: { name: 'groom', icon: 'content_cut' },
  matchmove: { name: 'matchmove', icon: 'switch_video' },
  vdbcache: { name: 'vdbcache', icon: 'local_fire_department' },
  lightrig: { name: 'lightrig', icon: 'wb_incandescent' },
  lut: { name: 'lut', icon: 'opacity' },
  workfile: { name: 'workfile', icon: 'home_repair_service' },
}

export default productTypes

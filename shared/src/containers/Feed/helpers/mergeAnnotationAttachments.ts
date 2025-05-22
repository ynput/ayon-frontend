import { SavedAnnotationMetadata } from '../../index'

export default (activities: any[]) => {
  return activities.map((activity) => {
    if (activity.activityType !== 'comment' || !activity.activityData?.annotations) return activity

    const files = activity.files
      .map((file: any) => {
        // look for an annotation that is using this file
        const annotation = activity.activityData.annotations.find(
          (annotation: SavedAnnotationMetadata) =>
            annotation.composite === file.id || annotation.transparent === file.id,
        )

        // if the file is the transparent version of the annotation, ignore it
        if (annotation.transparent === file.id) return null

        return { ...file, annotation }
      })
      .filter(Boolean)

    const newActivity = { ...activity, files }
    return newActivity
  })
}

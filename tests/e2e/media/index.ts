import path from 'path'

export type Media = {
  path: string
  fileName: string
  width: number
  height: number
  frames?: number
}

const media = (fileName: string, width: number, height: number, frames?: number): Media => ({
  path: path.join(__dirname, fileName),
  fileName,
  width,
  height,
  frames,
})

// regenerate with ffmpeg 7, X264="-c:v libx264 -pix_fmt yuv420p -g 1 -preset veryslow -crf 30 -movflags +faststart -an -map_metadata -1 -fflags +bitexact -flags:v +bitexact"
export const MEDIA = {
  // ffmpeg -f lavfi -i color=c=navy:s=160x90:r=24:d=10 -vf drawbox=x=70:y=35:w=20:h=20:c=yellow:t=fill $X264 navy_160x90_10s.mp4
  navyVideo: media('navy_160x90_10s.mp4', 160, 90, 240),
  // ffmpeg -f lavfi -i color=c=darkgreen:s=128x72:r=24:d=10 -vf drawbox=x=54:y=26:w=20:h=20:c=white:t=fill $X264 green_128x72_10s.mp4
  greenVideo: media('green_128x72_10s.mp4', 128, 72, 240),
  // ffmpeg -f lavfi -i smptebars=size=200x100 -frames:v 1 -map_metadata -1 -fflags +bitexact still_200x100.png
  stillImage: media('still_200x100.png', 200, 100),
  // ffmpeg -f lavfi -i color=c=gray:s=64x36:r=24:d=1 -c:v mpeg4 -q:v 31 -an -map_metadata -1 -fflags +bitexact -flags:v +bitexact unsupported_mpeg4.mp4
  unsupportedVideo: media('unsupported_mpeg4.mp4', 64, 36, 24),
}

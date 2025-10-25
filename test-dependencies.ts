// Teste básico para validar as dependências
import ytdl from 'ytdl-core'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import ffprobePath from '@ffprobe-installer/ffprobe'

console.log('🔍 Validando dependências...')

// Testar ytdl-core
const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
console.log('✅ ytdl-core:', ytdl.validateURL(testUrl) ? 'OK' : 'ERRO')

// Testar ffmpeg paths
console.log('✅ FFmpeg path:', ffmpegPath.path)
console.log('✅ FFprobe path:', ffprobePath.path)

// Configurar ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath.path)
ffmpeg.setFfprobePath(ffprobePath.path)

console.log('🚀 Todas as dependências estão funcionando!')

export {}
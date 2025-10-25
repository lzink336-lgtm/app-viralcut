'use server'

import ytdl from 'ytdl-core'
import { ytdl as ytdlDistube } from '@distube/ytdl-core'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import ffprobePath from '@ffprobe-installer/ffprobe'
import fs from 'fs-extra'
import tmp from 'tmp'
import path from 'path'

// Configurar ffmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath.path)
ffmpeg.setFfprobePath(ffprobePath.path)

interface DownloadResult {
  filePath: string
  duration: number
  width: number
  height: number
}

export async function downloadYoutube(url: string): Promise<DownloadResult> {
  try {
    // Validar URL do YouTube
    if (!ytdl.validateURL(url)) {
      throw new Error('URL inválida. Por favor, forneça um link válido do YouTube.')
    }

    // Obter informações do vídeo
    const info = await ytdl.getInfo(url)
    const videoDetails = info.videoDetails
    
    if (!videoDetails) {
      throw new Error('Não foi possível obter informações do vídeo.')
    }

    // Verificar se o vídeo é privado ou restrito
    if (videoDetails.isPrivate) {
      throw new Error('Este vídeo é privado e não pode ser processado.')
    }

    if (!videoDetails.isLiveContent && videoDetails.lengthSeconds === '0') {
      throw new Error('Vídeo não disponível ou com duração inválida.')
    }

    const duration = parseInt(videoDetails.lengthSeconds || '0')
    
    if (duration === 0) {
      throw new Error('Não foi possível determinar a duração do vídeo.')
    }

    // Criar arquivo temporário
    const tempFile = tmp.fileSync({ 
      prefix: 'youtube_video_', 
      suffix: '.mp4',
      keep: true 
    })

    try {
      // Tentar baixar formato progressivo 720p (vídeo+áudio juntos)
      const formats = ytdl.filterFormats(info.formats, 'videoandaudio')
      const progressiveFormat = formats.find(format => 
        format.height === 720 && 
        format.container === 'mp4' &&
        format.hasVideo && 
        format.hasAudio
      )

      if (progressiveFormat) {
        console.log('Baixando formato progressivo 720p...')
        
        return new Promise<DownloadResult>((resolve, reject) => {
          const stream = ytdl(url, { format: progressiveFormat })
          const writeStream = fs.createWriteStream(tempFile.name)
          
          stream.pipe(writeStream)
          
          stream.on('error', (error) => {
            console.error('Erro no stream de download:', error)
            reject(new Error(`Erro ao baixar vídeo: ${error.message}`))
          })
          
          writeStream.on('error', (error) => {
            console.error('Erro ao escrever arquivo:', error)
            reject(new Error(`Erro ao salvar vídeo: ${error.message}`))
          })
          
          writeStream.on('finish', () => {
            resolve({
              filePath: tempFile.name,
              duration: duration,
              width: progressiveFormat.width || 1280,
              height: progressiveFormat.height || 720
            })
          })
        })
      } else {
        // Fallback: merge adaptativo melhor vídeo + melhor áudio
        console.log('Formato progressivo não encontrado, fazendo merge adaptativo...')
        
        // Obter melhor formato de vídeo
        const videoFormats = ytdl.filterFormats(info.formats, 'videoonly')
        const bestVideo = videoFormats.reduce((best, format) => {
          if (!best) return format
          const bestHeight = best.height || 0
          const formatHeight = format.height || 0
          return formatHeight > bestHeight ? format : best
        })

        // Obter melhor formato de áudio
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly')
        const bestAudio = audioFormats.reduce((best, format) => {
          if (!best) return format
          const bestBitrate = parseInt(best.audioBitrate || '0')
          const formatBitrate = parseInt(format.audioBitrate || '0')
          return formatBitrate > bestBitrate ? format : best
        })

        if (!bestVideo || !bestAudio) {
          throw new Error('Não foi possível encontrar formatos de vídeo e áudio adequados.')
        }

        // Criar arquivos temporários para vídeo e áudio separados
        const videoTemp = tmp.fileSync({ prefix: 'video_', suffix: '.mp4', keep: true })
        const audioTemp = tmp.fileSync({ prefix: 'audio_', suffix: '.mp4', keep: true })

        // Baixar vídeo
        await new Promise<void>((resolve, reject) => {
          const videoStream = ytdl(url, { format: bestVideo })
          const videoWriteStream = fs.createWriteStream(videoTemp.name)
          
          videoStream.pipe(videoWriteStream)
          videoStream.on('error', reject)
          videoWriteStream.on('error', reject)
          videoWriteStream.on('finish', resolve)
        })

        // Baixar áudio
        await new Promise<void>((resolve, reject) => {
          const audioStream = ytdl(url, { format: bestAudio })
          const audioWriteStream = fs.createWriteStream(audioTemp.name)
          
          audioStream.pipe(audioWriteStream)
          audioStream.on('error', reject)
          audioWriteStream.on('error', reject)
          audioWriteStream.on('finish', resolve)
        })

        // Fazer merge com ffmpeg
        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input(videoTemp.name)
            .input(audioTemp.name)
            .outputOptions([
              '-c:v copy',
              '-c:a aac',
              '-strict experimental'
            ])
            .output(tempFile.name)
            .on('error', (error) => {
              console.error('Erro no ffmpeg merge:', error)
              reject(new Error(`Erro ao fazer merge do vídeo: ${error.message}`))
            })
            .on('end', () => {
              // Limpar arquivos temporários
              fs.unlinkSync(videoTemp.name)
              fs.unlinkSync(audioTemp.name)
              resolve()
            })
            .run()
        })

        return {
          filePath: tempFile.name,
          duration: duration,
          width: bestVideo.width || 1280,
          height: bestVideo.height || 720
        }
      }
    } catch (downloadError: any) {
      // Fallback para @distube/ytdl-core em caso de throttling
      console.log('Tentando fallback com @distube/ytdl-core...')
      
      try {
        const distubeInfo = await ytdlDistube.getInfo(url)
        const distubeFormats = ytdlDistube.filterFormats(distubeInfo.formats, 'videoandaudio')
        const distubeFormat = distubeFormats.find(format => 
          format.height === 720 && format.container === 'mp4'
        ) || distubeFormats[0]

        if (!distubeFormat) {
          throw new Error('Nenhum formato adequado encontrado no fallback.')
        }

        return new Promise<DownloadResult>((resolve, reject) => {
          const stream = ytdlDistube(url, { format: distubeFormat })
          const writeStream = fs.createWriteStream(tempFile.name)
          
          stream.pipe(writeStream)
          
          stream.on('error', (error) => {
            reject(new Error(`Erro no fallback: ${error.message}`))
          })
          
          writeStream.on('error', (error) => {
            reject(new Error(`Erro ao salvar no fallback: ${error.message}`))
          })
          
          writeStream.on('finish', () => {
            resolve({
              filePath: tempFile.name,
              duration: duration,
              width: distubeFormat.width || 1280,
              height: distubeFormat.height || 720
            })
          })
        })
      } catch (fallbackError: any) {
        throw new Error(`Falha no download e no fallback: ${fallbackError.message}`)
      }
    }

  } catch (error: any) {
    console.error('Erro em downloadYoutube:', error)
    
    if (error.message.includes('Private video')) {
      throw new Error('Este vídeo é privado e não pode ser processado.')
    }
    if (error.message.includes('Video unavailable')) {
      throw new Error('Vídeo não disponível. Verifique se o link está correto.')
    }
    if (error.message.includes('This video is not available')) {
      throw new Error('Este vídeo não está disponível em sua região.')
    }
    
    throw new Error(`Erro ao baixar vídeo: ${error.message}`)
  }
}
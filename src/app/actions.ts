'use server'

import { extractVideoId, getMp4Url, generateCopy } from './utils'

export async function processVideo(url: string) {
  try {
    if (!url || !url.trim()) {
      throw new Error('URL do YouTube é obrigatória.')
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada. Configure a chave da API do OpenAI.')
    }

    const videoId = extractVideoId(url)
    if (!videoId) {
      throw new Error('URL do YouTube inválida.')
    }

    const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

    const mp4Url = await getMp4Url(videoId)

    const { titulo, descricao, hashtags } = await generateCopy()

    return {
      mp4Url,
      thumbUrl,
      titulo,
      descricao,
      hashtags
    }

  } catch (error: any) {
    console.error('Erro em processVideo:', error)
    throw new Error(error.message || 'Erro desconhecido ao processar vídeo')
  }
}</content>
<parameter name="path">src/app/actions.ts
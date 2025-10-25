export function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

export async function getMp4Url(videoId: string): Promise<string> {
  try {
    const response = await fetch(`https://piped.video/streams/${videoId}`)
    if (!response.ok) {
      throw new Error(`Erro ao buscar streams: ${response.status}`)
    }
    const data = await response.json()

    if (!data.videoStreams || data.videoStreams.length === 0) {
      throw new Error('Vídeo não encontrado ou indisponível.')
    }

    // Procurar por stream 720p MPEG-4
    const stream = data.videoStreams.find((s: any) =>
      s.quality === '720p' && s.format === 'MPEG_4'
    )

    if (!stream) {
      // Fallback para qualquer MPEG-4 disponível
      const fallbackStream = data.videoStreams.find((s: any) => s.format === 'MPEG_4')
      if (!fallbackStream) {
        throw new Error('Nenhum stream MP4 disponível para este vídeo.')
      }
      return fallbackStream.url
    }

    return stream.url

  } catch (error: any) {
    console.error('Erro em getMp4Url:', error)
    throw new Error(`Falha ao obter link do vídeo: ${error.message}`)
  }
}

export async function generateCopy(): Promise<{ titulo: string; descricao: string; hashtags: string[] }> {
  try {
    const prompt = `Generate viral content in English for a YouTube short about billionaire mindset, money, and success for US audience:

1. A clickable title (max 70 characters) that creates curiosity and aspiration
2. A 2-3 line motivational description with subtle CTA
3. 8-10 hashtags including these core ones: #BillionaireMindset #Wealth #StartupLife #MoneyTalk #Success #RichHabits, plus 2-4 contextual ones

Format as JSON:
{
  "titulo": "...",
  "descricao": "...",
  "hashtags": ["#tag1", "#tag2", ...]
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`Erro na API OpenAI: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('Resposta vazia da OpenAI.')
    }

    const result = JSON.parse(content)

    if (!result.titulo || !result.descricao || !Array.isArray(result.hashtags)) {
      throw new Error('Formato de resposta inválido da IA.')
    }

    return {
      titulo: result.titulo.substring(0, 70),
      descricao: result.descricao,
      hashtags: result.hashtags
    }

  } catch (error: any) {
    console.error('Erro em generateCopy:', error)
    throw new Error(`Falha ao gerar conteúdo: ${error.message}`)
  }
}</content>
<parameter name="path">src/app/utils.ts
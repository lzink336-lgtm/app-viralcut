"use client"

import { useState } from 'react'
import { Play, Download, Zap, Crown, AlertCircle, CheckCircle, Settings, X, Eye, EyeOff, Copy } from 'lucide-react'
import { processVideo } from './actions'

interface Result {
  mp4Url: string
  thumbUrl: string
  titulo: string
  descricao: string
  hashtags: string[]
}

export default function ViralCutPro() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  const handleProcess = async () => {
    if (!url.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await processVideo(url)
      setResult(data)
    } catch (err: any) {
      setError(err.message)
      if (err.message.includes('OPENAI_API_KEY')) {
        setShowApiKeyModal(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Poderia mostrar um toast de sucesso
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      // Em uma implementação real, salvaria no servidor
      // Por enquanto, apenas fechar modal
      setShowApiKeyModal(false)
      setApiKey('')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="border-b border-[#FFD700]/20 bg-black/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-lg flex items-center justify-center">
                <Crown className="w-7 h-7 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                  ViralCut Pro
                </h1>
                <p className="text-sm text-gray-400">Web Functional Fix</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] bg-clip-text text-transparent">
            Transform Videos Into Viral Gold
          </h2>
          <p className="text-xl text-gray-300">
            Cole um link do YouTube e gere conteúdo viral automaticamente
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-gray-900/50 rounded-2xl p-8 border border-[#FFD700]/20 backdrop-blur-sm mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-[#FFD700] mb-3">
                Link do Vídeo do YouTube
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-black/50 border border-[#FFD700]/30 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:border-[#FFD700] focus:outline-none text-lg"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleProcess}
              disabled={!url.trim() || loading}
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-bold py-4 px-8 rounded-xl text-xl hover:from-[#FFA500] hover:to-[#FFD700] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3"
            >
              <Zap className="w-6 h-6" />
              <span>{loading ? 'Processando...' : 'Criar Short Viral'}</span>
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-gray-900/50 rounded-2xl p-8 border border-[#FFD700]/20 backdrop-blur-sm mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700]"></div>
              <p className="text-lg text-[#FFD700]">Gerando seu short viral...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <h3 className="text-xl font-bold text-red-400">Erro</h3>
            </div>
            <p className="text-red-300 mb-6">{error}</p>
            {error.includes('OPENAI_API_KEY') && (
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="bg-[#FFD700] hover:bg-[#FFA500] text-black font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Configurar API Key</span>
              </button>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-gray-900/50 rounded-2xl p-8 border border-[#FFD700]/20 backdrop-blur-sm">
            <div className="flex items-center space-x-3 mb-8">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <h3 className="text-2xl font-bold text-green-400">Short Viral Criado!</h3>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Video Section */}
              <div className="space-y-6">
                <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden relative max-w-sm mx-auto">
                  <img
                    src={result.thumbUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="w-16 h-16 text-white/80" />
                  </div>
                </div>

                <a
                  href={result.mp4Url}
                  download
                  className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-bold py-4 px-6 rounded-xl hover:from-[#FFA500] hover:to-[#FFD700] transition-all flex items-center justify-center space-x-3"
                >
                  <Download className="w-5 h-5" />
                  <span>Baixar MP4</span>
                </a>
              </div>

              {/* Content Section */}
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-[#FFD700] mb-2">
                    Título Otimizado
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={result.titulo}
                      readOnly
                      className="flex-1 bg-black/50 border border-[#FFD700]/30 rounded-lg px-4 py-3 text-white"
                    />
                    <button
                      onClick={() => handleCopy(result.titulo)}
                      className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors"
                      title="Copiar título"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-[#FFD700] mb-2">
                    Descrição Motivacional
                  </label>
                  <div className="flex space-x-2">
                    <textarea
                      value={result.descricao}
                      readOnly
                      className="flex-1 bg-black/50 border border-[#FFD700]/30 rounded-lg px-4 py-3 text-white h-24 resize-none"
                    />
                    <button
                      onClick={() => handleCopy(result.descricao)}
                      className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors self-start mt-1"
                      title="Copiar descrição"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Hashtags */}
                <div>
                  <label className="block text-sm font-semibold text-[#FFD700] mb-2">
                    Hashtags
                  </label>
                  <div className="flex space-x-2">
                    <textarea
                      value={result.hashtags.join(' ')}
                      readOnly
                      className="flex-1 bg-black/50 border border-[#FFD700]/30 rounded-lg px-4 py-3 text-white h-20 resize-none text-sm"
                    />
                    <button
                      onClick={() => handleCopy(result.hashtags.join(' '))}
                      className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors self-start mt-1"
                      title="Copiar hashtags"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-[#FFD700]/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#FFD700]">Configurar OpenAI API Key</h3>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-300 mb-6">
              Para usar o ViralCut Pro, você precisa configurar sua chave da API do OpenAI.
              Obtenha sua chave em{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FFD700] hover:underline"
              >
                platform.openai.com
              </a>
            </p>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-black/50 border border-[#FFD700]/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#FFD700] focus:outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveApiKey}
                  disabled={!apiKey.trim()}
                  className="flex-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold py-3 px-6 rounded-lg hover:from-[#FFA500] hover:to-[#FFD700] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#FFD700]/20 bg-black/90 backdrop-blur-sm py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Crown className="w-6 h-6 text-[#FFD700]" />
            <span className="text-lg font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              ViralCut Pro - Web Functional Fix
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            Transforme qualquer vídeo em conteúdo viral. Usando APIs públicas e IA.
          </p>
        </div>
      </footer>
    </div>
  )
}</content>
<parameter name="path">src/app/page.tsx
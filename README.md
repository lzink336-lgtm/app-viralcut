# ViralCut Pro - Web Functional Fix

Transforme qualquer vídeo do YouTube em shorts virais usando APIs públicas e IA avançada.

## 🚀 Funcionalidades

- **Download via API**: Obtém link direto MP4 usando APIs públicas (Piped.video)
- **Geração Automática**: Cria títulos otimizados, descrições motivacionais e hashtags virais
- **Interface Luxuosa**: Design black & gold inspirado em marcas premium
- **Copiar e Baixar**: Facilita o compartilhamento e download do conteúdo

## 🛠️ Stack Técnico

- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Server Actions do Next.js
- **APIs**: Piped.video para download, OpenAI GPT para geração de conteúdo
- **Processamento**: Node puro com fetch (sem binários locais)

## 📦 Instalação

1. **Clone o repositório**:
```bash
git clone <repo-url>
cd viralcut-pro
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Configure as variáveis de ambiente**:
```bash
cp .env.example .env.local
```

Adicione sua chave da OpenAI:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

4. **Execute o projeto**:
```bash
npm run dev
```

### Backend FastAPI

O backend Python processa download, transcrição e geração dos cortes virais. Para executá-lo localmente:

1. **Crie e ative um ambiente virtual**
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

2. **Instale as dependências**
   ```bash
   pip install -r requirements.txt
   ```

   Para habilitar o túnel opcional do ngrok, confirme que o pacote está instalado:
   ```bash
   pip install pyngrok
   ```

3. **Inicie o servidor**
   ```bash
   uvicorn main:app --reload
   ```

O serviço estará disponível em [http://127.0.0.1:8000](http://127.0.0.1:8000). Ao final do boot o terminal exibirá
`Servidor iniciado com sucesso`. Se a variável de ambiente `ENABLE_NGROK=1` estiver configurada, o log mostrará o endereço
externo do túnel criado automaticamente.

> ℹ️ Executar `python main.py` com o pacote `pyngrok` instalado ativa o túnel automaticamente. Para desabilitar esse
> comportamento, defina `ENABLE_NGROK=0` antes de iniciar o servidor.

## 🔧 Configuração

### OpenAI API Key

1. Acesse [platform.openai.com](https://platform.openai.com/api-keys)
2. Crie uma nova API key
3. Adicione no arquivo `.env.local` ou use o modal na interface

### APIs Públicas

- **Piped.video**: Usada para obter links diretos de download MP4
- **YouTube Thumbnails**: Imagens de preview oficiais do YouTube

## 🎯 Como Usar

1. **Cole um link do YouTube** na interface
2. **Clique em "Criar Short Viral"**
3. **Aguarde o processamento** (download + geração de conteúdo)
4. **Baixe o MP4** e copie título, descrição e hashtags

## 📱 Interface

### Tela Principal
- Input para URL do YouTube
- Botão "Criar Short Viral"
- Preview com thumbnail
- Campos para título, descrição e hashtags (somente leitura)
- Botões de copiar e download

### Modal de API Key
- Configuração segura da chave OpenAI
- Validação automática
- Campo com toggle de visibilidade

## 🎨 Design System

### Cores
- **Primária**: #FFD700 (Dourado)
- **Secundária**: #FFA500 (Laranja dourado)
- **Background**: #000000 (Preto)
- **Texto**: #FFFFFF (Branco)
- **Acentos**: Gradientes dourados

### Tipografia
- **Títulos**: Gradientes dourados
- **Corpo**: Branco/cinza
- **Labels**: Dourado para destaque

## 🚨 Tratamento de Erros

O sistema exibe erros reais:

- **URL inválida**: Validação de formato YouTube
- **Vídeo indisponível**: Detecção de restrições ou vídeos privados
- **Erro de API**: Problemas com Piped.video ou OpenAI
- **API Key ausente**: Modal de configuração

## 🔄 Pipeline de Processamento

```
URL → Validação → Obter Link MP4 → Gerar Conteúdo → Entrega Final
```

### Etapas Detalhadas

1. **Validação**: Verifica formato da URL do YouTube
2. **Download Link**: Busca stream MP4 via Piped.video API
3. **Thumbnail**: Obtém imagem de preview do YouTube
4. **Geração de Copy**: GPT-3.5-turbo cria título, descrição e hashtags

## 📊 Formatos Suportados

### Input
- **YouTube URLs**: Todos os formatos padrão (youtube.com/watch?v=..., youtu.be/...)

### Output
- **Vídeo**: Link direto MP4 (via API)
- **Thumbnail**: JPG oficial do YouTube
- **Copy**: Título (máx. 70 chars), descrição motivacional, hashtags virais

## 🔐 Segurança

- **API Keys**: Armazenadas como variáveis de ambiente
- **Validação**: URLs verificadas antes do processamento
- **HTTPS**: Todas as chamadas usam HTTPS

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Outros
Compatível com qualquer plataforma que suporte Next.js.

## 📈 Performance

- **Processamento rápido**: Apenas chamadas de API, sem processamento local
- **Respostas otimizadas**: Conteúdo gerado sob demanda

## 🐛 Troubleshooting

### Erro de Download
- Verificar se URL é válida e vídeo é público
- Testar com outro vídeo

### Erro de Geração
- Confirmar OPENAI_API_KEY configurada
- Verificar créditos na conta OpenAI

### Erro de API
- Verificar conexão de internet
- APIs públicas podem ter limitações

## 📄 Licença

MIT License - Veja [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**ViralCut Pro** - Transforme qualquer vídeo em conteúdo viral. 👑

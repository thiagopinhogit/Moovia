# Moovia: AI Video Creator

Um aplicativo de criação de vídeos com Inteligência Artificial desenvolvido em React Native + Expo.

## 🎯 Funcionalidades

- **Home Screen**: Navegação por categorias de efeitos de vídeo
- **Category Detail**: Visualização detalhada de cada efeito disponível
- **Edit Screen**: Seleção de vídeo/imagem e descrição do que deseja criar
- **Loading Screen**: Animação durante o processamento do vídeo
- **Integração com API**: Pronto para integrar com APIs de geração de vídeo por IA

## 📋 Categorias de Efeitos

### Video Creation 🎬
- Text to Video
- Image to Video
- Video Enhancement
- AI Avatar

### Effects ✨
- Style Transfer
- Motion Effects
- Transitions
- Filters

### Creative 🎨
- Artistic Style
- Background Change
- Scene Generation

### Enhancement 📸
- HD Quality
- Color Grading
- Stabilization

## 🚀 Como Executar

### Pré-requisitos
- Node.js (v20.19.4 ou superior recomendado)
- npm ou yarn
- Expo CLI
- Expo Go app no seu dispositivo móvel (iOS/Android)

### Instalação

1. Clone o repositório e navegue até a pasta:
```bash
cd Moovia
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o projeto:
```bash
npm start
```

4. Use o Expo Go no seu celular para escanear o QR code e visualizar o app

### Scripts Disponíveis

- `npm start` - Inicia o Metro bundler
- `npm run android` - Executa no emulador Android
- `npm run ios` - Executa no simulador iOS
- `npm run web` - Executa no navegador

## 🔧 Configuração da API

Para integrar com a API de geração de vídeo, edite o arquivo `src/services/api.ts`:

```typescript
const API_URL = 'YOUR_VIDEO_AI_API_URL'; // Substitua com a URL real
const API_KEY = 'YOUR_API_KEY'; // Substitua com sua chave de API
```

## 📁 Estrutura do Projeto

```
Moovia/
├── src/
│   ├── constants/
│   │   └── categories.ts       # Categorias e efeitos disponíveis
│   ├── navigation/
│   │   └── index.tsx            # Configuração de navegação
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Tela principal
│   │   ├── CategoryDetailScreen.tsx  # Detalhes do efeito
│   │   ├── EditScreen.tsx       # Edição de vídeo
│   │   └── LoadingScreen.tsx    # Tela de carregamento
│   ├── services/
│   │   └── api.ts               # Integração com API
│   └── types/
│       └── index.ts             # Tipos TypeScript
├── App.tsx
└── package.json
```

## 🎨 Design

O app segue um design minimalista e moderno com:
- Fundo cinza claro (#F5F5F5)
- Cards com bordas arredondadas
- Botões com sombras suaves
- Animações smooth
- Interface intuitiva e limpa

## 📱 Permissões Necessárias

- **Galeria de Fotos/Vídeos**: Para selecionar mídia do dispositivo
- **Câmera**: Para capturar vídeos e fotos diretamente

## 🔄 Fluxo do Usuário

1. Usuário abre o app e vê a home com categorias
2. Pode clicar no botão principal ou em um efeito específico
3. Seleciona uma foto/vídeo da galeria
4. Descreve o que quer criar (ou usa descrição pré-definida do efeito)
5. Clica em "Generate"
6. Aguarda o processamento com animação
7. Recebe o vídeo gerado

## 🛠️ Tecnologias Utilizadas

- **React Native**: Framework para desenvolvimento mobile
- **Expo**: Plataforma para desenvolvimento React Native
- **TypeScript**: Tipagem estática
- **React Navigation**: Navegação entre telas
- **Expo Image Picker**: Seleção de imagens/vídeos
- **Expo Linear Gradient**: Gradientes

## 📝 Próximos Passos

- [ ] Integrar com API de geração de vídeo por IA
- [ ] Adicionar tela de resultado para mostrar vídeo gerado
- [ ] Implementar funcionalidade de salvar/compartilhar vídeo
- [ ] Adicionar mais efeitos e categorias
- [ ] Implementar sistema de Pro/Premium
- [ ] Adicionar histórico de criações
- [ ] Melhorar animações e transições

## 🤝 Contribuindo

Este é um projeto privado. Para contribuir, entre em contato com o time.

## 📄 Licença

Todos os direitos reservados © 2025 Moovia


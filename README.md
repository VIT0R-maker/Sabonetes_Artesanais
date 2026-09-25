# Toque de Amor — Saboaria Artesanal

Site editorial responsivo em português, criado com HTML, CSS, JavaScript, GSAP e ScrollTrigger. As fotografias fornecidas são servidas em AVIF, WebP e JPEG, com resoluções responsivas. Fontes e bibliotecas são locais.

## Executar

Requer Node.js 18 ou superior. Não há dependências para instalar.

```sh
npm run dev
```

Abra `http://127.0.0.1:4173`. Para verificar arquivos, âncoras, contatos e sintaxe:

```sh
npm run check
```

## Publicação

O diretório público é `dist/`. Não exige compilação. A configuração de Sites está em `.openai/hosting.json`. O servidor de desenvolvimento é apenas uma prévia local.

## Conteúdo e contatos

- WhatsApp: `https://wa.me/5516991753408`
- Instagram: `https://www.instagram.com/saboaria130/`
- Conteúdo: `dist/index.html`
- Estilos: `dist/styles.css`
- Animações e navegação: `dist/app.js`

A coleção apresenta os produtos das imagens. Valores, aromas e disponibilidade são consultados diretamente com a marca; não foram inventados preços ou benefícios terapêuticos.

## Acessibilidade e movimento

Menu móvel com diálogo nativo, Escape e foco; link para pular a navegação; descrições de imagens; indicadores de foco; rolagem nativa e controle por botões na coleção. A preferência `prefers-reduced-motion` desliga parallax e cenas fixadas. Sem JavaScript, o conteúdo e os contatos continuam disponíveis.

As cenas sensoriais fixadas funcionam em telas a partir de 1024 × 720. A coleção acompanha a rolagem vertical a partir de 1024 × 900; nas demais telas utiliza rolagem horizontal nativa e botões. As animações são reconfiguradas ao redimensionar.

## Recursos

Fotografias e identidade fornecidas pelo proprietário. GSAP 3.13.0 e ScrollTrigger: GreenSock, conforme licença do distribuidor. Fontes Cormorant Garamond e DM Sans: Google Fonts, sob SIL Open Font License.

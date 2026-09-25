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

## Publicação no GitHub Pages

O `index.html`, o CSS, o JavaScript e a pasta `assets/` ficam na raiz do repositório. Não é necessário instalar dependências, compilar ou criar um workflow.

Em **Settings → Pages → Build and deployment**, escolha:

- **Source:** Deploy from a branch
- **Branch:** main
- **Folder:** / (root)

Clique em **Save**. O arquivo `.nojekyll` mantém a publicação como HTML estático. Novos commits na `main` atualizam o site automaticamente; o GitHub pode levar alguns minutos para publicar.

Site: https://vit0r-maker.github.io/Sabonetes_Artesanais/

Os caminhos dos recursos são relativos, compatíveis com o subdiretório do GitHub Pages. O antigo workflow que publicava `dist/` foi retirado para evitar duas formas de publicação concorrentes.

Para uma exportação opcional destinada a outra hospedagem, execute `npm run build`. Isso gera a pasta ignorada `dist/` a partir dos arquivos da raiz, mantendo compatibilidade com `.openai/hosting.json`. A origem dos arquivos continua sendo a raiz. O servidor de desenvolvimento publica apenas os arquivos do site.

## Conteúdo e contatos

- WhatsApp: `https://wa.me/5516991753408`
- Instagram: `https://www.instagram.com/saboaria130/`
- Conteúdo: `index.html`
- Estilos: `styles.css`
- Animações e navegação: `app.js`

A coleção apresenta os produtos das imagens. Valores, aromas e disponibilidade são consultados diretamente com a marca; não foram inventados preços ou benefícios terapêuticos.

## Acessibilidade e movimento

Menu móvel com diálogo nativo, Escape e foco; link para pular a navegação; descrições de imagens; indicadores de foco; rolagem nativa e controle por botões na coleção. A preferência `prefers-reduced-motion` desliga parallax e cenas fixadas. Sem JavaScript, o conteúdo e os contatos continuam disponíveis.

Desktop e celular têm animações de entrada, parallax, máscaras e aproximação das fotos. No celular, o movimento usa distâncias menores e mantém os textos legíveis. A sequência sensorial faz transições entre Texturas, Aromas e Sensações em telas móveis com altura a partir de 560 pixels; em celulares deitados com pouca altura, as cenas seguem na vertical com animações leves. No desktop, as cenas fixadas continuam a partir de 1024 × 720.

A coleção acompanha a rolagem vertical a partir de 1024 × 900. Nas demais telas, mantém o gesto horizontal nativo e os botões anterior/próximo. As animações são reconfiguradas ao mudar de orientação ou tamanho; a expansão/retração da barra do navegador móvel não reinicia a narrativa. A preferência de acessibilidade **reduzir movimento** continua respeitada.

## Recursos

Fotografias e identidade fornecidas pelo proprietário. GSAP 3.13.0 e ScrollTrigger: GreenSock, conforme licença do distribuidor. Fontes Cormorant Garamond e DM Sans: Google Fonts, sob SIL Open Font License.

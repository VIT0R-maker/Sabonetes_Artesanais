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

## Resposta da narrativa ao scroll

O controlador em `assets/cinematic.js` lê a posição nativa da página no próximo `requestAnimationFrame`, usando os limites calculados pelo ScrollTrigger. Não há mais interpolação de 90 ms no celular / 120 ms no desktop: parar ou inverter a rolagem define imediatamente o quadro desejado. O tempo é alinhado aos 24 quadros por segundo do material original.

Cada vídeo tem no máximo uma busca em andamento. Enquanto o decodificador está ocupado, apenas o destino mais recente é mantido; ao terminar, a próxima busca usa a posição atual, inclusive quando o gesto mudou de direção entre dois frames. As transições, os textos e a pausa final mantêm os mesmos intervalos. Consultas de elementos foram retiradas do ciclo de animação, e estilos/controles só são escritos quando mudam.

Os vídeos foram preparados para acesso aleatório, mantendo os cortes e a inversão da ponte de lavanda:

| Arquivo | Desktop, MiB | Mobile, MiB |
| --- | ---: | ---: |
| `01-black` | 3,12 | 3,09 |
| `02-blue` | 3,99 | 3,85 |
| `03-craft` | 3,99 | 3,30 |
| `04-lavender-bridge` | 3,33 | 2,96 |
| `05-lavender-finale` | 3,05 | 3,14 |

- Desktop: H.264, 1280×720, CRF 20, keyframe a cada 6 quadros, sem B-frames.
- Mobile: H.264, 854×480, CRF 22, todos os quadros independentes, sem B-frames. Isso elimina a necessidade de decodificar até 12 quadros anteriores em cada busca.
- Ambos: 24 fps, sem áudio, `yuv420p`, `faststart`. Metadados e tamanhos exatos em `assets/videos/manifest.json`.

A troca favorece a resposta durante a interação: os cinco vídeos móveis completos passam de aproximadamente 7,90 para 16,34 MiB. Eles continuam carregando progressivamente, com apenas uma cena adiantada na direção do gesto, liberação das cenas distantes e nenhum download de vídeo no modo de economia de dados ou redução de movimento. O botão “Ver sem movimento” e os fallbacks de erro continuam disponíveis.

Para reproduzir os arquivos, instale FFmpeg e execute `node scripts/prepare-videos.mjs "pasta-dos-originais"`. Opcionalmente, indique o executável pela variável `FFMPEG`. Os originais ficam fora do repositório.

### Verificação da correção

`npm run check` inclui resposta no primeiro frame, parada sem movimento residual, inversão, destino mais recente durante busca pendente, alinhamento de quadros, fallbacks e requisições HTTP parciais. Em uma comparação local no navegador Chromium, usando 90 buscas medidas por arquivo após aquecimento e arquivos já em memória, a média do primeiro clipe móvel caiu de **18,25 ms para 9,76 ms**; a mediana caiu de **19,90 ms para 10,50 ms**. É uma medição do decodificador nesta máquina, não uma garantia de latência em qualquer celular ou conexão. Os arquivos continuam contendo os 24 fps originais; não foram criados quadros artificiais.

O workflow atual da raiz, `.github/workflows/deploy.yml`, publica a pasta `site/`. Esta correção está nessa pasta e preserva essa configuração feita pelo proprietário.


# 🎱 Bingo Tracker

Sistema inteligente de acompanhamento de cartelas
de bingo, desenvolvido com React, TypeScript,
Vite e Tailwind CSS.

O Bingo Tracker permite acompanhar várias cartelas
simultaneamente, registrar números sorteados e
identificar automaticamente vitórias e situações
de quase bingo.

O aplicativo foi pensado especialmente para
utilização em celulares, com interface responsiva
e armazenamento local.

## ✨ Funcionalidades

### 🎟️ Gerenciamento de cartelas

- Cadastrar várias cartelas.
- Identificar cada cartela por número ou código.
- Editar cartelas existentes.
- Excluir cartelas.
- Importar números por sequência de texto.
- Visualizar cartelas em modo normal ou compacto.
- Ordenar cartelas por cadastro, identificador
  ou proximidade da vitória.

### 🎱 Acompanhamento dos sorteios

- Registrar números de 1 a 75.
- Identificar automaticamente a letra B-I-N-G-O.
- Impedir números duplicados.
- Exibir histórico dos números sorteados.
- Desfazer o último sorteio.
- Remover um número registrado incorretamente.
- Atualizar automaticamente todas as cartelas.

### 🏆 Identificação de vencedores

O sistema analisa as cartelas utilizando as
modalidades de vitória habilitadas.

Modalidades disponíveis:

- Linha horizontal.
- Coluna vertical.
- Quatro cantos.
- Diagonal.
- Cartela cheia.

As modalidades podem ser ativadas ou desativadas
individualmente.

Configuração padrão:

| Modalidade | Padrão |
|---|---|
| Horizontal | Ativada |
| Vertical | Ativada |
| Quatro cantos | Ativada |
| Diagonal | Desativada |
| Cartela cheia | Desativada |

O centro da cartela é considerado livre.

### ⚠️ Quase bingo

O aplicativo identifica combinações que precisam
de apenas mais um número para vencer.

Quando isso acontece, a cartela pode apresentar
um alerta indicando o número que falta.

### 🔄 Nova rodada

Ao iniciar uma nova rodada:

- Os números sorteados são zerados.
- As marcações são recalculadas.
- As cartelas cadastradas são preservadas.
- As configurações permanecem salvas.
- O contador de rodadas é incrementado.

### 💾 Armazenamento e backup

- Salvamento local no navegador.
- Restauração automática ao reabrir o aplicativo.
- Exportação de backup em JSON.
- Importação de backup em JSON.

**Importante:** os dados ficam armazenados no
navegador utilizado. Para transferir dados entre
dispositivos ou navegadores, utilize o backup JSON.

O Bingo Tracker não utiliza servidor ou banco de
dados remoto nesta versão.

## 📋 Formato das cartelas

O Bingo Tracker utiliza cartelas tradicionais
de bingo com 75 números.

Cada cartela possui:

- 5 linhas.
- 5 colunas: B, I, N, G e O.
- 24 números.
- 1 espaço central livre.

### Intervalos das colunas

| Coluna | Intervalo |
|---|---|
| B | 1 a 15 |
| I | 16 a 30 |
| N | 31 a 45 |
| G | 46 a 60 |
| O | 61 a 75 |

### Exemplo de cartela

| B | I | N | G | O |
|---|---|---|---|---|
| 6 | 22 | 35 | 50 | 65 |
| 10 | 17 | 38 | 55 | 70 |
| 3 | 29 | LIVRE | 58 | 71 |
| 14 | 16 | 41 | 49 | 63 |
| 11 | 28 | 44 | 59 | 74 |

### Importação por sequência

Para cadastrar a cartela, informe os números
na ordem das colunas:

1. Cinco números da coluna B.
2. Cinco números da coluna I.
3. Quatro números da coluna N.
4. Cinco números da coluna G.
5. Cinco números da coluna O.

Cada número deve ser precedido pela letra
da coluna correspondente.

Separe os valores utilizando ponto e vírgula.

Exemplo completo:

```text
B6;B10;B3;B14;B11;I22;I17;I29;I16;I28;N35;N38;N41;N44;G50;G55;G58;G49;G59;O65;O70;O71;O63;O74
```

O espaço central livre não deve ser incluído.

O aplicativo distribui os números
automaticamente na grade 5×5.

### Utilização com fotos

O Bingo Tracker não realiza reconhecimento
automático de imagens nesta versão.

Para utilizar uma cartela fotografada:

1. Fotografe a cartela.
2. Transcreva seus números para o formato
   B-I-N-G-O apresentado acima.
3. Copie a sequência.
4. Abra o cadastro de cartelas.
5. Informe o identificador da cartela.
6. Cole a sequência.
7. Confira os números e salve.

A transcrição também pode ser feita com auxílio
de uma ferramenta externa de leitura de imagens.

Sempre confira a sequência antes de cadastrá-la.

## 🎮 Como jogar

1. Cadastre todas as suas cartelas.
2. Abra as configurações.
3. Escolha as modalidades de vitória válidas.
4. Registre cada número anunciado no sorteio.
5. Acompanhe as marcações automáticas.
6. Observe os alertas de quase bingo.
7. Confira os avisos de vitória.

Quando a partida terminar, utilize a opção
**Nova rodada** para recomeçar mantendo
as mesmas cartelas.

## 📱 Modos de visualização

### Normal

Exibe as cartelas em uma lista vertical,
com mais espaço para leitura.

### Compacto

Organiza as cartelas em uma grade de duas
colunas em telas pequenas, permitindo
acompanhar várias cartelas simultaneamente.

## 🎨 Aparência

O aplicativo possui configurações para:

- Tema escuro.
- Tema claro.
- Visualização normal.
- Visualização compacta.
- Ordenação das cartelas.

O suporte visual completo aos dois temas
depende da padronização de todos os componentes.

## 🛠️ Tecnologias

- React 19
- TypeScript 5.7
- Vite 6
- Tailwind CSS 4
- Lucide React
- Vitest 3
- GitHub Actions
- GitHub Pages

## 📦 Instalação

É necessário ter Node.js instalado.

Recomendação: Node.js 22.

Clone o repositório:

```bash
git clone https://github.com/SEU-USUARIO/bingo-tracker.git
```

Entre na pasta:

```bash
cd bingo-tracker
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra o endereço informado pelo Vite.

## 🧪 Testes automatizados

O projeto possui testes para:

- Validação de cartelas.
- Identificação de combinações vencedoras.
- Quase bingo.
- Registro de números.
- Desfazer sorteios.
- Nova rodada.
- Importação e exportação de sequências.

Execute:

```bash
npm run test -- --run
```

Os testes devem ser executados e aprovados
antes de considerar uma versão validada.

## 🏗️ Compilação

Para gerar uma versão de produção:

```bash
npm run build
```

Os arquivos serão gerados na pasta:

```text
dist/
```

## 🚀 Publicação no GitHub Pages

O projeto inclui um workflow de publicação:

```text
.github/workflows/deploy.yml
```

### Configuração

1. Crie um repositório no GitHub.
2. Envie os arquivos do projeto.
3. Inclua o arquivo package-lock.json.
4. Abra Settings > Pages.
5. Em Build and deployment, selecione
   GitHub Actions.
6. Confirme que a branch principal é main.
7. Execute o workflow ou envie um novo commit.

O workflow:

- Instala as dependências.
- Executa os testes.
- Compila o aplicativo.
- Publica os arquivos no GitHub Pages.

A publicação será interrompida se alguma
etapa obrigatória falhar.

### Endereço do aplicativo

Para um repositório chamado bingo-tracker:

```text
https://SEU-USUARIO.github.io/bingo-tracker/
```

Substitua SEU-USUARIO pelo usuário do GitHub.

## 📂 Estrutura principal

```text
bingo-tracker/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   ├── components/
│   │   ├── BingoCard.tsx
│   │   ├── BingoGrid.tsx
│   │   ├── BingoSettings.tsx
│   │   ├── CardForm.tsx
│   │   └── NumberInput.tsx
│   ├── features/
│   │   └── bingo/
│   │       ├── engine.ts
│   │       ├── engine.test.ts
│   │       ├── parser.ts
│   │       └── parser.test.ts
│   ├── hooks/
│   │   └── useBingoGame.ts
│   ├── models/
│   │   └── bingo.ts
│   ├── storage/
│   │   └── bingoStorage.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔐 Privacidade

O Bingo Tracker não exige criação de conta.

As informações da partida são armazenadas
localmente no navegador.

O usuário é responsável por guardar seus
arquivos de backup.

Limpar os dados do navegador pode remover
as cartelas e o histórico armazenados.

## 📌 Estado do projeto

Projeto em desenvolvimento.

A estrutura principal, o motor de regras,
os componentes de interface e os testes
automatizados foram preparados.

A compilação integrada e a execução dos testes
ainda precisam ser verificadas antes da
primeira publicação estável.

## 📄 Licença

Nenhuma licença de distribuição foi definida
nesta versão.

Antes de disponibilizar o projeto para
reutilização por terceiros, escolha uma
licença apropriada e adicione o arquivo LICENSE.

# Bola de Cristal

Simulador do Brasileirão Série A 2026. Joga o restante do campeonato milhares de vezes e estima, para cada clube, a chance de título, de vaga na Libertadores, de vaga na Sul-Americana e de rebaixamento.

**Acesse:** https://boladecristal.app.br/

## O que dá para fazer

- Ver a chance de queda de cada time e a pontuação final projetada.
- Lançar palpites de placar jogo a jogo, por rodada ou pelos jogos restantes de um time, e ver a tabela recalcular na hora.
- Analisar um time em foco: evolução rodada a rodada, jogos decisivos e chance por pontuação final.
- Compartilhar um cenário por um código curto (Z4…).

## Como funciona

A força de ataque e de defesa de cada clube é estimada por um modelo de Poisson (família Maher / Dixon-Coles), com prior da temporada 2025, peso maior para os jogos recentes e incerteza dos parâmetros. Cada jogo em aberto é sorteado a partir da distribuição de placares, e o campeonato inteiro é simulado por Monte Carlo (100 mil a 1 milhão de vezes). A metodologia completa, com fórmulas e referências, está na aba *Metodologia* do próprio site.

O cálculo roda inteiro no navegador de quem acessa. O site é um único arquivo, `index.html`, atualizado após cada rodada com os resultados oficiais.

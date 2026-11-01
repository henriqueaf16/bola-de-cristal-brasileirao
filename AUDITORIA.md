# Revisão do simulador — 01/11/2026

Base examinada: branch `main` recebida em 01/11/2026. O site é estático, com motor, dados e interface em `index.html`, repetidos nas 20 páginas dos clubes. Não foram encontrados scripts do backtest de 2015–2024, previsões individuais ou dados históricos completos no repositório. Os resultados históricos publicados não foram reproduzidos nesta revisão.

## Correções verificáveis

1. **Ordenação:** a chave numérica usava bases fixas de 512 para saldo e gols. Saldos extremos, possíveis com os placares admitidos, podiam invadir o peso das vitórias. A comparação agora aplica pontos, vitórias, saldo e gols diretamente; empates continuam dividindo as vagas.
2. **Cauda de gols:** o sorteio incremental de Poisson colocava todos os valores acima de dez em dez. A grade exibida, porém, truncava e renormalizava. Os dois caminhos agora usam a distribuição condicionada a 0–10, mantendo o limite já documentado. Isso corrige a inconsistência, mas não elimina a limitação da truncagem.
3. **Resultados raros:** depois do limite de rejeições, os modos `fresh` e `uni` recorriam à grade média, trocando silenciosamente a força daquele campeonato. A reserva agora mantém a distribuição do conjunto de parâmetros selecionado.
4. **Fronteiras da CDF:** um sorteio uniforme igual a zero podia selecionar uma célula sem massa. A inversão agora usa o primeiro acumulado estritamente maior que o sorteio.
5. **Gols esperados por jogo:** eram calculados nos parâmetros pontuais, enquanto as probabilidades exibidas integravam a incerteza. Agora os valores exibidos usam a média das intensidades dos mesmos conjuntos sorteados. São intensidades preditivas de Poisson; por causa da truncagem não são exatamente a média da grade limitada a dez.
6. **Jogos decisivos:** o texto invocava a lei da probabilidade total usando percentuais de uma aproximação externa de 200 grades. A linha de frequência agora usa a mesma amostra que produz as probabilidades condicionais.
7. **Comparação externa:** valores arquivados em `DATA.bench.date` eram apresentados como se correspondessem à data atual. A data própria e a possibilidade de bases distintas agora aparecem explicitamente. A documentação do ValorFinal já publica avaliação e versões posteriores à citada anteriormente.
8. **Cartão do clube:** com palpites ativos, o percentual atual aparecia ao lado de uma variação histórica independente do cenário. Nesse estado, a variação agora é contra a simulação sem palpites.

As mudanças numéricas podem alterar percentuais, ainda que o código do cenário seja igual. A reprodutibilidade exige mesma base, versão do motor e nível de precisão. Os snapshots históricos embutidos continuam sendo os arquivos anteriores; não foram recalculados. Uma reavaliação histórica deve preceder novas alegações de desempenho do motor revisado.

## Interface

- Palpites rápidos de vitória/empate, mantendo entrada de placar exato e compatibilidade dos códigos.
- Botão para desfazer por partida e indicação explícita de qual hipótese permanece aplicada durante edição parcial ou inválida.
- Resumo próximo aos controles com chance sem palpites, chance no cenário e diferença em pontos percentuais.
- Jogos encerrados recolhidos quando há partidas abertas na rodada.
- Escolha de clube opcional, sem modal automático na primeira visita.
- Azul e roxo distinguem as faixas continentais, mantendo creme, oliva e terracota. As configurações de vagas aparecem apenas nas métricas correspondentes.
- No layout estreito, o painel de palpites precede a tabela. A revisão visual foi realizada em computador; a avaliação em celulares reais permanece pendente.
- Nomes dos clubes na tabela são botões acessíveis pelo teclado; controles rápidos e campos têm área mínima de 44px.
- A legenda de incerteza distingue erro numérico de erro do modelo, e as faixas continentais não são apresentadas como classificação completa por todas as vias.

Os seletores de objetivo já compartilhavam o mesmo estado no código original. Esse sincronismo foi preservado.

## Limites e trabalho necessário para evolução estatística

1. **Validação:** fornecer o backtest, dados congelados, tratamento de adiamentos, hiperparâmetros candidatos e previsões por jogo/clube. Separar seleção de parâmetros e avaliação final por temporadas; calcular incerteza respeitando a dependência dentro de cada temporada. Os 1.400 registros não são 1.400 desfechos independentes.
2. **Classificação continental:** faixas fixas e contagens configuráveis não reproduzem todas as redistribuições e exclusões de clubes classificados por copas. Modelar essas identidades antes de chamar o indicador de probabilidade completa de vaga.
3. **Condicionamento:** `P(desfecho | resultado sorteado)` repondera implicitamente a força dos times. Fixar uma hipótese no simulador preserva a distribuição anterior da força. Os recursos continuam respondendo a perguntas distintas, agora documentadas; unificá-los exige definir o significado pretendido.
4. **Desempate:** confronto direto, cartões e sorteio continuam ausentes. Implementar confronto direto de acordo com o regulamento e respeitar a distinção entre empate de dois e de mais clubes. A divisão equitativa é uma aproximação declarada.
5. **Prior e dinâmica:** avaliar ratings ajustados por adversário da temporada anterior, informação da Série B para promovidos e evolução de força durante a temporada. Não foram alterados hiperparâmetros sem evidência fora da amostra.
6. **Incerteza:** testar a aproximação local de Laplace contra uma alternativa de amostragem; medir a convergência das 200 grades e incluir análise de sensibilidade dos hiperparâmetros. A verossimilhança temporalmente ponderada não dispensa calibração empírica.
7. **Caudas por pontuação:** mostrar suporte amostral, incerteza dos cortes e rótulos que evitem interpretar o máximo observado como garantia matemática. A revisão esclarece o texto, mas não cria novos intervalos para esses cortes.
8. **Comparação de cenários:** a semente ainda depende do cenário; diferenças pequenas podem incluir ruído de Monte Carlo. Sorteios comuns com fluxos estáveis por partida e parâmetros são uma evolução possível, com testes de variância antes da adoção.
9. **Histórico:** reconstruções com o modelo atual e previsões publicadas na época devem ser armazenadas e identificadas separadamente. Validar título e faixas continentais, além de queda.

## Verificação

Requer Node.js 24 ou mais recente, sem instalação de dependências:

```sh
node --test --test-isolation=none tests/engine.test.cjs
node scripts/sync-team-pages.mjs --check
```

Onze testes verificam sintaxe, ordenação extrema, empates, fronteiras da CDF, distribuição analítica de gols, reservas condicionais, placares exatos, integridade dos 380 confrontos, médias preditivas, conservação de vagas/posições e execução incremental reproduzível. Cinco casos de regressão falharam ao serem executados contra a versão original e passaram com as correções. Esses testes não medem a capacidade preditiva histórica.

O script `scripts/sync-team-pages.mjs` propaga a aplicação da página principal para os clubes, preservando os metadados específicos de cada um. Execute-o após editar `index.html`, e depois rode o modo `--check`.

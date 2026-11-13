# Bola de Cristal — onde editar

O `index.html`, as páginas de time, `sitemap.xml`, `robots.txt` e `og.png` deste repositório são GERADOS.
Todo dia a tarefa "Atualizar bola de cristal" sobrescreve esses arquivos com o que está publicado no artifact
"Simulador do Brasileirão 2026" (https://claude.ai/code/artifact/19ca3e20-a538-44e9-a148-8f2e4f25dc9a).

Qualquer mudança de interface, texto ou comportamento precisa ser feita no kit do artifact
(`kit/src/template.txt` para HTML/CSS e `kit/src/app.js` para JS), rodando `node src/build.js`,
republicando o artifact com todos os arquivos do kit e só depois gerando o site com `node src/site.js`.
Commits que mudam só o `index.html` daqui são apagados na atualização seguinte.

Commits que mudam arquivos gerados e cuja mudança já está no kit devem ter "[kit]" na mensagem. Sem essa marca, a sincronização diária para e avisa o Henrique em vez de sobrescrever.

Mantidos à mão (a sincronização não apaga): README.md, CNAME, CLAUDE.md e assets/.

# Task: Fixar minicursos novos aparecendo (Quarta Figma + Quinta Criptocoins)

## Status: Em progresso ✅

### Passo 1: Restart server [Pendente]
```
# Terminal 1
cd /home/esdrasbrito/Downloads/eagleForm
node server.js
```
- Esperado: "DB pronto: X minicursos"

### Passo 2: Verificar API minicursos [Pendente]
```
curl http://localhost:3000/api/minicursos
```
- Deve mostrar JSON com 16 minicursos incluindo:
  * Figma (Quarta, Samuel Lima)
  * Criptocoins (Quinta, Danne Makleyston)

### Passo 3: Forçar reseed se necessário [Pendente]
Se novos não aparecerem (seed skipped por count>0):
```
# No admin.html ou psql direto
DELETE FROM minicursos;  # Perde inscrições atuais!
```
Restart server → auto-seed 16 cursos.

### Passo 4: Test frontend [Pendente]
```
# Novo terminal
cd /home/esdrasbrito/Downloads/eagleForm/public
python3 -m http.server 3001  # or live-server
# Open http://localhost:3001/minicursos.html
```
- Deve mostrar cards com contadores independentes.

### Passo 5: ✅ Concluir
- Use `attempt_completion` quando vir os 2 novos cards funcionando.

**Execute:** `Ctrl+C server` → `node server.js` → veja "✅ Adicionado: Figma Quarta" e "✅ Total final: 16" → abra minicursos.html**



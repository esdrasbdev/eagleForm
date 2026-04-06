# EagleForm Minicursos DB Fix Progress

**CRITICAL BUG:** \`initDb()\` was **DELETING ALL MINICURSOS** on server restart → inscricoes counts "reset" (minicursos recreated with ID 1-N).

**FIX:** ✅ database.js updated:
- Removed \`DELETE FROM minicursos\`
- Added check: Seed **ONLY if 0 minicursos**
- Idempotent INSERT (ON CONFLICT DO NOTHING)
- Logging for transparency

## Next Steps:
```
- [x] 1. Create TODO.md 
- [x] 2. Fix database.js (NON-DESTRUCTIVE)
- [ ] 3. \`node server.js\` → Test persistence
- [ ] 4. Inscribe to 20 in 1 course → Verify block + restart server (no reset)
- [ ] 5. attempt_completion
```

**Prod Impact:** Restart server → data now PRESERVED forever!


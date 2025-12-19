# ⚠️ Nota Importante sobre Versão

## Versão Atual: 1.0.0 (Build 3)

### Por que a versão ainda é 1.0.0?

A versão **1.0.0** ainda **não foi aprovada** pela Apple. Quando uma versão é rejeitada na App Store Review, o processo correto é:

1. ✅ **Manter** a mesma `version` (1.0.0)
2. ✅ **Incrementar** o `buildNumber` (1 → 2 → 3)
3. ✅ Fazer as correções necessárias
4. ✅ Resubmeter para review

### Quando mudar a versão?

A versão só deve ser incrementada para **1.0.1** (ou maior) DEPOIS que:
- ✅ A versão 1.0.0 for **aprovada** pela Apple
- ✅ Estiver publicada na App Store
- ✅ Houver uma nova atualização a ser lançada

### Histórico de Builds

| Build | Status | Data | Observações |
|-------|--------|------|-------------|
| 1 | ❌ Rejeitado | Dez 16 | Loading infinito no iPad |
| 2 | ❌ Rejeitado | Dez 17 | Botões não responsivos |
| 3 | ⏳ Em revisão | Dez 17 | Correções de erro handling |

### Configuração Atual

```json
// app.json
{
  "version": "1.0.0",
  "ios": {
    "buildNumber": "3"
  }
}
```

### Referências

- [Apple: About build numbers](https://developer.apple.com/documentation/xcode/build-settings-reference)
- [App Store Connect: Versioning](https://developer.apple.com/app-store/version-information/)

---

**Data:** Dezembro 17, 2025
**Status:** Build 3 pronto para submissão


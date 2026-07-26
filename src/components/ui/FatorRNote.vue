<script setup lang="ts">
withDefaults(defineProps<{
  /** compact: versão mais enxuta para modais/laterais */
  compact?: boolean
}>(), { compact: false })
</script>

<template>
  <aside class="fr-note" :class="{ 'fr-note--compact': compact }">
    <div class="fr-note__head">
      <span class="fr-note__badge">🧮</span>
      <h4 class="fr-note__title">Quando o Fator R é usado?</h4>
    </div>

    <p class="fr-note__intro">
      O Fator R só é usado em um cenário específico: empresas de
      <strong>prestação de serviços no Simples Nacional</strong>, e apenas para algumas atividades.
    </p>

    <ul class="fr-note__list">
      <li class="fr-note__item fr-note__item--ok">
        <strong>Serve para decidir o anexo:</strong>
        <code>Fator R = Folha (12 meses) / Receita bruta (12 meses)</code>.
        Se <strong>≥ 28% → Anexo III</strong> (6% na 1ª faixa); se
        <strong>&lt; 28% → Anexo V</strong> (15,5%). É recalculado mês a mês.
      </li>
      <li class="fr-note__item fr-note__item--no">
        <strong>NÃO se aplica a:</strong> comércio (Anexo I), indústria/confeitaria (Anexo II)
        — esses têm anexo fixo. Também não existe no Lucro Presumido/Real.
      </li>
      <li class="fr-note__item fr-note__item--info">
        <strong>Só vale para as atividades de serviço</strong> que a lei sujeita ao Fator R
        (TI/desenvolvimento, consultoria, engenharia, contabilidade, arquitetura, medicina,
        odontologia etc.). Alguns serviços são sempre Anexo III (fixos) e outros sempre Anexo V
        — o “vai e volta” pelo Fator R é só para o grupo listado.
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.fr-note {
  position: relative;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg, 14px);
  background:
    linear-gradient(180deg, color-mix(in srgb, #059669 6%, transparent), transparent 60%),
    var(--color-surface);
  padding: var(--space-5) var(--space-5) var(--space-5) var(--space-6);
  overflow: hidden;
}
/* Barra de acento à esquerda */
.fr-note::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #34d399, #059669);
}

.fr-note__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.fr-note__badge {
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.15rem; line-height: 1;
  background: color-mix(in srgb, #059669 12%, transparent);
  border-radius: 10px;
  flex-shrink: 0;
}
.fr-note__title {
  font-size: .975rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.fr-note__intro {
  font-size: .875rem;
  line-height: 1.55;
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}
.fr-note__intro strong { color: var(--color-text); }

.fr-note__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  list-style: none;
  margin: 0; padding: 0;
}
.fr-note__item {
  position: relative;
  padding-left: var(--space-5);
  font-size: .8375rem;
  line-height: 1.55;
  color: var(--color-text-muted);
}
.fr-note__item strong { color: var(--color-text); }
.fr-note__item::before {
  content: '';
  position: absolute;
  left: 0; top: .5em;
  width: 8px; height: 8px;
  border-radius: 50%;
}
.fr-note__item--ok::before   { background: #059669; }
.fr-note__item--no::before   { background: #d97706; }
.fr-note__item--info::before { background: #0284c7; }

.fr-note code {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: .78em;
  padding: .1em .4em;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 5px;
  color: var(--color-text);
  white-space: nowrap;
}

/* Compacto — para modal / lateral estreita */
.fr-note--compact {
  padding: var(--space-4) var(--space-4) var(--space-4) var(--space-5);
}
.fr-note--compact .fr-note__badge { width: 28px; height: 28px; font-size: 1rem; }
.fr-note--compact .fr-note__title { font-size: .9rem; }
.fr-note--compact .fr-note__intro { font-size: .8125rem; margin-bottom: var(--space-3); }
.fr-note--compact .fr-note__item { font-size: .78rem; }
.fr-note--compact code { white-space: normal; }

@media (prefers-color-scheme: dark) {
  .fr-note {
    background:
      linear-gradient(180deg, color-mix(in srgb, #34d399 10%, transparent), transparent 60%),
      var(--color-surface);
  }
}
</style>

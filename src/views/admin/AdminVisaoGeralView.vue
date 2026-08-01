<script setup lang="ts">
/**
 * Gestão do Site — Visão Geral.
 * Painel de entrada do gestor: o tamanho da base num relance e os atalhos para
 * as duas listagens de trabalho (empresas e usuários).
 */
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useCurrency } from '@/composables/useMarkup'
import { segmentoConfig } from '@/config/segmentos'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import StatCard from '@/components/ui/StatCard.vue'
import type { SegmentoNegocio } from '@/types'

const store = useAdminStore()
const router = useRouter()
const { formatCurrency } = useCurrency()

onMounted(() => { if (!store.carregado) store.fetchTudo() })

const segmentos = computed(() =>
  (Object.entries(store.metricas.porSegmento) as [SegmentoNegocio, number][])
    .map(([chave, total]) => ({ ...segmentoConfig(chave), total }))
    .sort((a, b) => b.total - a.total)
)

/** Empresas com mais gente dentro — onde o suporte costuma ser demandado */
const maioresEquipes = computed(() =>
  [...store.empresasAdmin]
    .sort((a, b) => b.equipe.length - a.equipe.length)
    .slice(0, 5)
)
</script>

<template>
  <div class="admin-home">
    <header class="admin-hero">
      <div>
        <p class="admin-hero__eyebrow">Gestão do Site</p>
        <h2 class="admin-hero__title">Painel do gestor</h2>
        <p class="admin-hero__sub">
          Visão da base inteira — todas as empresas cadastradas e todos os usuários,
          independente de dono ou compartilhamento.
        </p>
      </div>
      <div class="admin-hero__actions">
        <button class="quick" @click="router.push('/admin/empresas')">
          <span class="quick__icon">▣</span>
          <span>
            <span class="quick__label">Empresas</span>
            <span class="quick__hint">listar e gerenciar equipes</span>
          </span>
        </button>
        <button class="quick" @click="router.push('/admin/usuarios')">
          <span class="quick__icon">◍</span>
          <span>
            <span class="quick__label">Usuários</span>
            <span class="quick__hint">acessos e status</span>
          </span>
        </button>
      </div>
    </header>

    <div class="stats-grid">
      <StatCard
        label="Empresas cadastradas"
        :value="String(store.metricas.totalEmpresas)"
        :sub="`${segmentos.length} segmento(s)`"
        icon="▣"
      />
      <StatCard
        label="Usuários na base"
        :value="String(store.metricas.totalUsuarios)"
        :sub="`${store.metricas.usuariosAtivos} ativos · ${store.metricas.usuariosInativos} inativos`"
        icon="◍"
      />
      <StatCard
        label="Vínculos usuário↔empresa"
        :value="String(store.metricas.totalVinculos)"
        sub="Acessos concedidos"
        icon="⇄"
      />
      <StatCard
        label="Faturamento médio somado"
        :value="formatCurrency(store.metricas.faturamentoTotal)"
        sub="Base declarada pelas empresas"
        icon="▤"
      />
    </div>

    <div class="admin-cols">
      <BaseCard title="Empresas por segmento">
        <ul class="seg-list">
          <li v-for="seg in segmentos" :key="seg.chave" class="seg-item">
            <span class="seg-item__icon">{{ seg.icone }}</span>
            <span class="seg-item__info">
              <span class="seg-item__nome">{{ seg.nome }}</span>
              <span class="seg-item__desc">{{ seg.descricao }}</span>
            </span>
            <span class="seg-item__total">{{ seg.total }}</span>
          </li>
        </ul>
      </BaseCard>

      <BaseCard title="Perfis em uso">
        <table class="table">
          <thead>
            <tr><th>Perfil</th><th>Usuários</th><th>Escopo</th></tr>
          </thead>
          <tbody>
            <tr v-for="linha in store.usuariosPorPerfil" :key="linha.perfil.id">
              <td><BaseBadge color="gray">{{ linha.perfil.nome }}</BaseBadge></td>
              <td>{{ linha.total }}</td>
              <td class="td-muted">
                {{ linha.perfil.escopoGlobal ? 'Global (todas as empresas)' : 'Por empresa' }}
              </td>
            </tr>
          </tbody>
        </table>
      </BaseCard>
    </div>

    <BaseCard title="Maiores equipes" subtitle="Empresas com mais usuários com acesso">
      <table class="table">
        <thead>
          <tr><th>Empresa</th><th>Dono</th><th>Usuários</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="linha in maioresEquipes" :key="linha.empresa.id">
            <td>
              <span class="cell-forte">{{ linha.empresa.razaoSocial }}</span>
              <span class="cell-sub">{{ linha.empresa.cnpj }}</span>
            </td>
            <td class="td-muted">{{ linha.dono?.nome ?? '—' }}</td>
            <td>{{ linha.equipe.length }}</td>
            <td class="td-acao">
              <RouterLink class="link" :to="`/admin/empresas/${linha.empresa.id}`">Gerenciar →</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </BaseCard>
  </div>
</template>

<style scoped>
.admin-home { display: flex; flex-direction: column; gap: var(--space-5); }

.admin-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-left: 3px solid var(--color-primary-600);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
}
.admin-hero__eyebrow {
  font-size: .6875rem; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: var(--color-primary-600);
}
.admin-hero__title { font-size: 1.25rem; font-weight: 700; color: var(--color-text); margin-top: 2px; }
.admin-hero__sub { font-size: .875rem; color: var(--color-text-muted); max-width: 60ch; margin-top: var(--space-1); }
.admin-hero__actions { display: flex; gap: var(--space-3); flex-shrink: 0; }

.quick {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  text-align: left;
  transition: border-color .15s, background .15s;
}
.quick:hover { border-color: var(--color-primary-500); background: var(--color-primary-100); }
.quick__icon { font-size: 1.1rem; color: var(--color-primary-600); }
.quick__label { display: block; font-size: .875rem; font-weight: 600; color: var(--color-text); }
.quick__hint { display: block; font-size: .75rem; color: var(--color-text-muted); }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4); }

.admin-cols { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }

.seg-list { list-style: none; display: flex; flex-direction: column; gap: var(--space-2); }
.seg-item {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius);
}
.seg-item__icon { font-size: 1.25rem; }
.seg-item__info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.seg-item__nome { font-size: .875rem; font-weight: 600; color: var(--color-text); }
.seg-item__desc { font-size: .75rem; color: var(--color-text-muted); }
.seg-item__total { font-size: 1.125rem; font-weight: 700; color: var(--color-primary-700); }

.table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.table th {
  text-align: left; padding: var(--space-2) var(--space-3);
  font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em;
  color: var(--color-text-muted); border-bottom: 1px solid var(--color-border-light);
}
.table td { padding: var(--space-3); border-bottom: 1px solid var(--color-border-light); vertical-align: middle; }
.td-muted { color: var(--color-text-muted); }
.td-acao { text-align: right; }
.cell-forte { display: block; font-weight: 600; color: var(--color-text); }
.cell-sub { display: block; font-size: .75rem; color: var(--color-text-muted); }

.link { font-size: .8125rem; font-weight: 600; color: var(--color-primary-700); }
.link:hover { text-decoration: underline; }

@media (max-width: 900px) {
  .admin-hero { flex-direction: column; }
  .admin-cols { grid-template-columns: 1fr; }
}
</style>

<script setup lang="ts">
/**
 * Gestão do Site — Detalhe da empresa.
 * Quem tem acesso a esta empresa, com que perfil, e as ações do gestor sobre
 * esses vínculos. O dono não pode ser desvinculado (REQ-07 / B9).
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useCurrency } from '@/composables/useMarkup'
import { usePaginacao } from '@/composables/usePaginacao'
import { segmentoConfig } from '@/config/segmentos'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import InfiniteScrollSentinel from '@/components/ui/InfiniteScrollSentinel.vue'

const route = useRoute()
const store = useAdminStore()
const { formatCurrency, formatPercent } = useCurrency()

const empresaId = computed(() => String(route.params.id))
const dados = computed(() => store.empresaAdminPorId(empresaId.value))
const seg = computed(() => segmentoConfig(dados.value?.empresa.segmento))

onMounted(() => { if (!store.carregado) store.fetchTudo() })

/** Última ação do gestor — inclusive as recusadas, que é o que ele precisa ver */
const aviso = ref<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
function relatar(ok: boolean, sucesso: string, falha: string) {
  aviso.value = ok ? { tipo: 'ok', texto: sucesso } : { tipo: 'erro', texto: falha }
}

const equipe = computed(() => dados.value?.equipe ?? [])

const {
  itensVisiveis, temMais, carregandoMais, totalItens, sentinelaEl, carregarMais,
} = usePaginacao(equipe, { pageSize: 10 })

/** Candidatos a vínculo: quem ainda não tem acesso e não é ADMIN global */
const candidatos = computed(() =>
  store.usuarios.filter(u =>
    !u.perfilGlobal && !u.empresas.some(v => v.empresaId === empresaId.value)
  )
)

const perfisAtribuiveis = computed(() => store.perfis.filter(p => !p.escopoGlobal))

const novoVinculo = ref({ usuarioId: '', perfilId: '' })

async function vincular() {
  if (!novoVinculo.value.usuarioId || !novoVinculo.value.perfilId) return
  const ok = await store.vincularUsuario(
    novoVinculo.value.usuarioId, empresaId.value, novoVinculo.value.perfilId
  )
  relatar(ok, 'Acesso concedido.', 'Não foi possível conceder o acesso.')
  if (ok) novoVinculo.value = { usuarioId: '', perfilId: '' }
}

async function trocarPerfil(usuarioId: string, perfilId: string) {
  const ok = await store.definirPerfilNoVinculo(usuarioId, empresaId.value, perfilId)
  relatar(ok, 'Perfil atualizado.', 'Não foi possível atualizar o perfil.')
}

async function desvincular(usuarioId: string, nome: string) {
  const ok = await store.desvincularUsuario(usuarioId, empresaId.value)
  relatar(ok, `${nome} perdeu o acesso a esta empresa.`,
    `${nome} é o dono da empresa — o vínculo do dono não pode ser removido.`)
}

async function alternarAtivo(usuarioId: string, ativo: boolean) {
  const resultado = await store.definirUsuarioAtivo(usuarioId, ativo)
  relatar(resultado !== null,
    ativo ? 'Usuário reativado.' : 'Usuário desativado.',
    'Não foi possível alterar o status.')
}

const iniciais = (nome: string) =>
  nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

const semUnderscore = (chave: string) => chave.replace(/_/g, ' ')

const fatorR = computed(() => {
  const emp = dados.value?.empresa
  if (!emp?.folhaPagamentoMensal || emp.faturamentoMedioMensal <= 0) return null
  return (emp.folhaPagamentoMensal / emp.faturamentoMedioMensal) * 100
})
</script>

<template>
  <div v-if="dados" class="admin-detalhe">
    <div class="voltar">
      <RouterLink class="link" to="/admin/empresas">← Todas as empresas</RouterLink>
    </div>

    <header class="ficha">
      <div class="ficha__icone">{{ seg.icone }}</div>
      <div class="ficha__info">
        <h2 class="ficha__nome">{{ dados.empresa.razaoSocial }}</h2>
        <p class="ficha__sub">{{ dados.empresa.cnpj }} · {{ seg.nome }}</p>
        <div class="ficha__tags">
          <BaseBadge color="gray">{{ semUnderscore(dados.empresa.regimeTributario) }}</BaseBadge>
          <BaseBadge v-if="dados.empresa.anexoCadastrado" color="gray">
            {{ dados.empresa.anexoCadastrado.replace('_', ' ') }}
          </BaseBadge>
          <BaseBadge color="gray">{{ dados.equipe.length }} usuário(s)</BaseBadge>
        </div>
      </div>
      <dl class="ficha__numeros">
        <div>
          <dt>Faturamento médio</dt>
          <dd>{{ formatCurrency(dados.empresa.faturamentoMedioMensal) }}</dd>
        </div>
        <div v-if="dados.empresa.folhaPagamentoMensal">
          <dt>Folha mensal</dt>
          <dd>{{ formatCurrency(dados.empresa.folhaPagamentoMensal) }}</dd>
        </div>
        <div v-if="fatorR !== null">
          <dt>Fator R</dt>
          <dd>{{ formatPercent(fatorR) }}</dd>
        </div>
        <div>
          <dt>Dono</dt>
          <dd class="dd-texto">{{ dados.dono?.nome ?? '—' }}</dd>
        </div>
      </dl>
    </header>

    <p v-if="aviso" class="aviso" :class="`aviso--${aviso.tipo}`">{{ aviso.texto }}</p>

    <BaseCard title="Usuários com acesso" subtitle="Perfil por empresa — o dono não pode perder o vínculo" padding="none">
      <div class="tabela-scroll">
      <table class="table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Perfil nesta empresa</th>
            <th>Status</th>
            <th class="th-acoes">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="membro in itensVisiveis" :key="membro.usuario.id">
            <td>
              <div class="usuario">
                <span class="avatar" :class="{ 'avatar--inativo': !membro.usuario.ativo }">
                  {{ iniciais(membro.usuario.nome) }}
                </span>
                <span class="usuario__info">
                  <span class="cell-forte">
                    {{ membro.usuario.nome }}
                    <BaseBadge v-if="membro.dono" color="purple">Dono</BaseBadge>
                  </span>
                  <span class="cell-sub">{{ membro.usuario.email }}</span>
                </span>
              </div>
            </td>
            <td>
              <select
                class="input input--select"
                :value="membro.perfil?.id ?? ''"
                @change="trocarPerfil(membro.usuario.id, ($event.target as HTMLSelectElement).value)"
              >
                <option v-if="!membro.perfil" value="" disabled>Sem perfil</option>
                <option v-for="p in perfisAtribuiveis" :key="p.id" :value="p.id">{{ p.nome }}</option>
              </select>
            </td>
            <td>
              <BaseBadge :color="membro.usuario.ativo ? 'green' : 'gray'">
                {{ membro.usuario.ativo ? 'Ativo' : 'Inativo' }}
              </BaseBadge>
            </td>
            <td class="td-acoes">
              <BaseButton
                size="sm"
                variant="ghost"
                @click="alternarAtivo(membro.usuario.id, !membro.usuario.ativo)"
              >
                {{ membro.usuario.ativo ? 'Desativar' : 'Reativar' }}
              </BaseButton>
              <BaseButton
                size="sm"
                variant="danger"
                :disabled="membro.dono"
                :title="membro.dono ? 'O dono não pode ser desvinculado da própria empresa' : 'Remover acesso'"
                @click="desvincular(membro.usuario.id, membro.usuario.nome)"
              >
                Desvincular
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <div ref="sentinelaEl" class="sentinela-wrapper">
        <InfiniteScrollSentinel
          :carregando-mais="carregandoMais"
          :tem-mais="temMais"
          :total-itens="totalItens"
          @carregar-mais="carregarMais"
        />
      </div>
    </BaseCard>

    <BaseCard title="Conceder acesso" subtitle="Vincula um usuário já cadastrado a esta empresa">
      <form class="vincular" @submit.prevent="vincular">
        <div class="field">
          <label class="field__label">Usuário</label>
          <select v-model="novoVinculo.usuarioId" class="input input--select">
            <option value="" disabled>Selecione…</option>
            <option v-for="u in candidatos" :key="u.id" :value="u.id">
              {{ u.nome }} — {{ u.email }}
            </option>
          </select>
        </div>
        <div class="field">
          <label class="field__label">Perfil</label>
          <select v-model="novoVinculo.perfilId" class="input input--select">
            <option value="" disabled>Selecione…</option>
            <option v-for="p in perfisAtribuiveis" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </div>
        <BaseButton
          type="submit"
          :loading="store.loading"
          :disabled="!novoVinculo.usuarioId || !novoVinculo.perfilId"
        >
          Conceder acesso
        </BaseButton>
      </form>
      <p v-if="!candidatos.length" class="vazio">
        Todos os usuários elegíveis já têm acesso a esta empresa.
      </p>
    </BaseCard>
  </div>

  <div v-else class="nao-encontrada">
    <p>Empresa não encontrada.</p>
    <RouterLink class="link" to="/admin/empresas">← Voltar para a lista</RouterLink>
  </div>
</template>

<style scoped>
.admin-detalhe { display: flex; flex-direction: column; gap: var(--space-5); }

.voltar { margin-bottom: calc(var(--space-2) * -1); }
.link { font-size: .8125rem; font-weight: 600; color: var(--color-primary-700); }
.link:hover { text-decoration: underline; }

.ficha {
  display: flex;
  align-items: flex-start;
  gap: var(--space-5);
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-left: 3px solid var(--color-primary-600);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
}
.ficha__icone {
  width: 52px; height: 52px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem;
  background: var(--color-bg-subtle);
  border-radius: var(--radius);
}
.ficha__info { flex: 1; min-width: 0; }
.ficha__nome { font-size: 1.125rem; font-weight: 700; color: var(--color-text); }
.ficha__sub { font-size: .8125rem; color: var(--color-text-muted); }
.ficha__tags { display: flex; gap: var(--space-1); flex-wrap: wrap; margin-top: var(--space-2); }

.ficha__numeros { display: flex; gap: var(--space-6); flex-wrap: wrap; }
.ficha__numeros dt {
  font-size: .7rem; text-transform: uppercase; letter-spacing: .06em;
  color: var(--color-text-muted); font-weight: 600;
}
.ficha__numeros dd {
  font-size: 1rem; font-weight: 700; color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.ficha__numeros .dd-texto { font-size: .875rem; font-weight: 600; }

.aviso {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius);
  font-size: .8125rem;
  border: 1px solid;
}
.aviso--ok   { background: var(--color-bg-subtle); border-color: var(--color-border); color: var(--color-text); }
.aviso--erro { background: #fef2f2; border-color: #fca5a5; color: #b91c1c; }

.tabela-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.table { width: 100%; min-width: 720px; border-collapse: collapse; font-size: .875rem; }
.table th {
  text-align: left; padding: var(--space-3) var(--space-4);
  font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em;
  color: var(--color-text-muted); border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-subtle);
}
.table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-light); vertical-align: middle; }
.th-acoes, .td-acoes { text-align: right; }
.td-acoes { display: flex; gap: var(--space-2); justify-content: flex-end; }

.usuario { display: flex; align-items: center; gap: var(--space-3); }
.usuario__info { display: flex; flex-direction: column; min-width: 0; }
.avatar {
  width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
  background: var(--color-primary-700); color: #fff;
  font-size: .7rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.avatar--inativo { background: var(--color-primary-300); color: var(--color-primary-800); }

.cell-forte { display: flex; align-items: center; gap: var(--space-2); font-weight: 600; color: var(--color-text); }
.cell-sub { display: block; font-size: .75rem; color: var(--color-text-muted); }

.input {
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: .875rem;
  color: var(--color-text);
  background: var(--color-surface);
  outline: none;
  font-family: inherit;
}
.input:focus { border-color: var(--color-primary-500); box-shadow: 0 0 0 3px var(--focus-ring); }
.input--select { min-width: 170px; }

.sentinela-wrapper { border-top: 1px dashed var(--color-border-light); }

.vincular { display: flex; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
.field { display: flex; flex-direction: column; gap: var(--space-1); }
.field__label { font-size: .8125rem; font-weight: 500; color: var(--color-text-muted); }
.vazio { font-size: .8125rem; color: var(--color-text-muted); margin-top: var(--space-3); }

.nao-encontrada {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
  padding: var(--space-12); color: var(--color-text-muted);
}

@media (max-width: 900px) {
  .ficha { flex-direction: column; }
  .ficha__numeros { gap: var(--space-4); }
}
</style>

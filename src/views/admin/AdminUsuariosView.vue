<script setup lang="ts">
/**
 * Gestão do Site — Usuários.
 * Todos os usuários da base, o escopo de cada um (global ou por empresa), onde
 * entram e com que perfil. Edição fina de vínculo fica no detalhe da empresa;
 * aqui o gestor enxerga o conjunto e liga/desliga o acesso.
 */
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { usePaginacao } from '@/composables/usePaginacao'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import InfiniteScrollSentinel from '@/components/ui/InfiniteScrollSentinel.vue'

const store = useAdminStore()

onMounted(() => { if (!store.carregado) store.fetchTudo() })

const busca = ref('')
const filtroEmpresa = ref('')
const filtroPerfil = ref('')
const filtroStatus = ref<'' | 'ativos' | 'inativos'>('')

const filtrados = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  return store.usuariosAdmin.filter(({ usuario, perfilGlobal, acessos }) => {
    const casaTermo = !termo
      || usuario.nome.toLowerCase().includes(termo)
      || usuario.email.toLowerCase().includes(termo)
    const casaEmpresa = !filtroEmpresa.value
      || acessos.some(a => a.empresa.id === filtroEmpresa.value)
      || !!perfilGlobal            // ADMIN global alcança qualquer empresa
    const casaPerfil = !filtroPerfil.value
      || perfilGlobal?.id === filtroPerfil.value
      || acessos.some(a => a.perfil?.id === filtroPerfil.value)
    const casaStatus = !filtroStatus.value
      || (filtroStatus.value === 'ativos' ? usuario.ativo : !usuario.ativo)
    return casaTermo && casaEmpresa && casaPerfil && casaStatus
  })
})

const {
  itensVisiveis, temMais, carregandoMais, totalItens, sentinelaEl, carregarMais,
} = usePaginacao(filtrados, { pageSize: 10 })

const aviso = ref<string | null>(null)

async function alternarAtivo(usuarioId: string, nome: string, ativo: boolean) {
  const resultado = await store.definirUsuarioAtivo(usuarioId, ativo)
  aviso.value = resultado === null
    ? 'Não foi possível alterar o status.'
    : `${nome} agora está ${ativo ? 'ativo' : 'inativo'}.`
}

const iniciais = (nome: string) =>
  nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
</script>

<template>
  <div class="admin-usuarios">
    <div class="toolbar">
      <div class="toolbar__info">
        <h2 class="section-title">Usuários da base</h2>
        <p class="section-sub">
          {{ totalItens }} de {{ store.metricas.totalUsuarios }} usuários ·
          {{ store.metricas.usuariosAtivos }} ativos
        </p>
      </div>
      <div class="toolbar__filtros">
        <input v-model="busca" class="input" placeholder="Buscar por nome ou e-mail…" />
        <select v-model="filtroEmpresa" class="input input--select">
          <option value="">Todas as empresas</option>
          <option v-for="e in store.empresas" :key="e.id" :value="e.id">{{ e.razaoSocial }}</option>
        </select>
        <select v-model="filtroPerfil" class="input input--select">
          <option value="">Todos os perfis</option>
          <option v-for="p in store.perfis" :key="p.id" :value="p.id">{{ p.nome }}</option>
        </select>
        <select v-model="filtroStatus" class="input input--select">
          <option value="">Ativos e inativos</option>
          <option value="ativos">Só ativos</option>
          <option value="inativos">Só inativos</option>
        </select>
      </div>
    </div>

    <p v-if="aviso" class="aviso">{{ aviso }}</p>

    <BaseCard padding="none">
      <div class="tabela-scroll">
      <table class="table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Escopo</th>
            <th>Acessos</th>
            <th>Status</th>
            <th class="th-acoes">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="linha in itensVisiveis" :key="linha.usuario.id">
            <td>
              <div class="usuario">
                <span class="avatar" :class="{ 'avatar--inativo': !linha.usuario.ativo }">
                  {{ iniciais(linha.usuario.nome) }}
                </span>
                <span class="usuario__info">
                  <span class="cell-forte">{{ linha.usuario.nome }}</span>
                  <span class="cell-sub">{{ linha.usuario.email }}</span>
                </span>
              </div>
            </td>
            <td>
              <BaseBadge v-if="linha.perfilGlobal" color="purple">
                {{ linha.perfilGlobal.nome }} · global
              </BaseBadge>
              <BaseBadge v-else color="gray">Por empresa</BaseBadge>
            </td>
            <td>
              <div class="acessos">
                <RouterLink
                  v-for="acesso in linha.acessos"
                  :key="acesso.empresa.id"
                  class="acesso"
                  :to="`/admin/empresas/${acesso.empresa.id}`"
                  :title="`${acesso.empresa.razaoSocial} — ${acesso.perfil?.nome ?? 'sem perfil'}`"
                >
                  <span class="acesso__empresa">{{ acesso.empresa.razaoSocial }}</span>
                  <span class="acesso__perfil">
                    {{ acesso.perfil?.nome ?? 'sem perfil' }}{{ acesso.dono ? ' · dono' : '' }}
                  </span>
                </RouterLink>
                <span v-if="linha.perfilGlobal" class="acesso acesso--global">
                  <span class="acesso__empresa">Todas as empresas</span>
                  <span class="acesso__perfil">escopo global</span>
                </span>
                <span v-else-if="!linha.acessos.length" class="cell-sub">Sem acesso a nenhuma empresa</span>
              </div>
            </td>
            <td>
              <BaseBadge :color="linha.usuario.ativo ? 'green' : 'gray'">
                {{ linha.usuario.ativo ? 'Ativo' : 'Inativo' }}
              </BaseBadge>
            </td>
            <td class="td-acoes">
              <BaseButton
                size="sm"
                :variant="linha.usuario.ativo ? 'ghost' : 'secondary'"
                @click="alternarAtivo(linha.usuario.id, linha.usuario.nome, !linha.usuario.ativo)"
              >
                {{ linha.usuario.ativo ? 'Desativar' : 'Reativar' }}
              </BaseButton>
            </td>
          </tr>
          <tr v-if="!itensVisiveis.length">
            <td colspan="5" class="table__empty">Nenhum usuário encontrado com esses filtros.</td>
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
  </div>
</template>

<style scoped>
.admin-usuarios { display: flex; flex-direction: column; gap: var(--space-5); }

.toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
.section-title { font-size: 1rem; font-weight: 600; color: var(--color-text); }
.section-sub { font-size: .8125rem; color: var(--color-text-muted); }
.toolbar__filtros { display: flex; gap: var(--space-3); flex-wrap: wrap; }

.input {
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: .875rem;
  color: var(--color-text);
  background: var(--color-surface);
  outline: none;
  font-family: inherit;
  min-width: 220px;
}
.input:focus { border-color: var(--color-primary-500); box-shadow: 0 0 0 3px var(--focus-ring); }
.input--select { min-width: 170px; }

.aviso {
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: .8125rem;
  color: var(--color-text);
}

.tabela-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.table { width: 100%; min-width: 860px; border-collapse: collapse; font-size: .875rem; }
.table th {
  text-align: left; padding: var(--space-3) var(--space-4);
  font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em;
  color: var(--color-text-muted); border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-subtle);
}
.table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-light); vertical-align: middle; }
.table tbody tr:hover { background: var(--color-primary-50); }
.th-acoes, .td-acoes { text-align: right; }
.table__empty { text-align: center; color: var(--color-text-light); padding: var(--space-8) !important; }

.usuario { display: flex; align-items: center; gap: var(--space-3); }
.usuario__info { display: flex; flex-direction: column; min-width: 0; }
.avatar {
  width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
  background: var(--color-primary-700); color: #fff;
  font-size: .7rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.avatar--inativo { background: var(--color-primary-300); color: var(--color-primary-800); }

.cell-forte { font-weight: 600; color: var(--color-text); }
.cell-sub { display: block; font-size: .75rem; color: var(--color-text-muted); }

.acessos { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.acesso {
  display: flex; flex-direction: column;
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  transition: border-color .15s, background .15s;
  max-width: 240px;
}
.acesso:hover { border-color: var(--color-primary-400); background: var(--color-bg-subtle); }
.acesso--global { border-style: dashed; }
.acesso__empresa {
  font-size: .8125rem; font-weight: 600; color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.acesso__perfil { font-size: .6875rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .04em; }

.sentinela-wrapper { border-top: 1px dashed var(--color-border-light); }

@media (max-width: 768px) {
  .toolbar__filtros { width: 100%; flex-direction: column; }
  .input, .input--select { min-width: 0; width: 100%; }
}
</style>

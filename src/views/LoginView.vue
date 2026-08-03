<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = reactive({ email: '', senha: '' })
const error = ref('')
const aviso = ref('')

/**
 * Quem chega aqui com `?expirada=1` foi trazido pela perda de sessão (REQ-03),
 * não por escolha própria. Sem esta mensagem, o usuário é devolvido ao login no
 * meio de uma ação e não entende o que aconteceu.
 */
onMounted(() => {
  if (route.query.expirada) aviso.value = 'Sua sessão expirou. Entre novamente.'
})

async function handleLogin() {
  error.value = ''
  aviso.value = ''
  const ok = await auth.login(form.email, form.senha)
  if (ok) {
    router.push('/dashboard')
  } else {
    // A mensagem vem do store, que a traduziu do erro do backend — credencial
    // inválida, usuário inativo e servidor fora do ar não podem virar o mesmo
    // texto genérico (REQ-13).
    error.value = auth.erro ?? 'Não foi possível entrar.'
  }
}

/**
 * Atalhos de **desenvolvimento**: preenchem só o e-mail — a senha é digitada,
 * porque agora a autenticação é real. Some do build de produção (`import.meta.env.DEV`);
 * uma lista de contas conhecidas numa tela de login pública seria um convite.
 */
const emDesenvolvimento = import.meta.env.DEV

const demoUsers = [
  { label: 'ADMIN global', email: 'admin@markup.com.br', dica: 'vê as 4 empresas' },
  { label: 'Ana (dona)', email: 'ana@docesdaana.com.br', dica: 'Doces da Ana + NexaTech' },
  { label: 'Roberto (dono)', email: 'roberto@metalforte.com.br', dica: 'só MetalForte' },
  { label: 'Juliana (dona)', email: 'juliana@nexatech.com.br', dica: 'só NexaTech' },
  { label: 'Marcos (gerente)', email: 'marcos@docesdaana.com.br', dica: 'menu reduzido' },
  { label: 'Carla (vendedora)', email: 'carla@docesdaana.com.br', dica: 'menu mínimo' },
]
</script>

<template>
  <div class="login-page">
    <!-- Decoração de fundo -->
    <div class="login-page__bg">
      <div class="bg-circle bg-circle--1" />
      <div class="bg-circle bg-circle--2" />
      <div class="bg-circle bg-circle--3" />
    </div>

    <div class="login-box">
      <!-- Logo -->
      <div class="login-box__brand">
        <div class="brand-mark">M</div>
        <div>
          <h1 class="brand-name">Markup</h1>
          <p class="brand-sub">Precificação Estratégica</p>
        </div>
      </div>

      <div class="login-box__divider" />

      <h2 class="login-box__heading">Boas-vindas de volta</h2>
      <p class="login-box__desc">Acesse o sistema para precificar com inteligência.</p>

      <form class="login-form" @submit.prevent="handleLogin">
        <BaseInput
          v-model="form.email"
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          required
        />
        <BaseInput
          v-model="form.senha"
          label="Senha"
          type="password"
          placeholder="••••••••"
          required
        />

        <Transition name="slide-up">
          <div v-if="aviso" class="login-aviso">
            <span>⏱</span> {{ aviso }}
          </div>
        </Transition>

        <Transition name="slide-up">
          <div v-if="error" class="login-error">
            <span>⚠</span> {{ error }}
          </div>
        </Transition>

        <BaseButton type="submit" :loading="auth.loading" size="lg" style="width:100%; justify-content:center">
          Entrar no sistema
        </BaseButton>
      </form>

      <!-- Atalhos de desenvolvimento: só preenchem o e-mail -->
      <div v-if="emDesenvolvimento" class="demo-panel">
        <p class="demo-panel__label">Preencher e-mail (dev)</p>
        <div class="demo-panel__btns">
          <button
            v-for="u in demoUsers"
            :key="u.email"
            class="demo-btn"
            :title="u.dica"
            @click="form.email = u.email"
          >
            {{ u.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--color-primary-900);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  position: relative;
  overflow: hidden;
}

.login-page__bg { position: absolute; inset: 0; pointer-events: none; }
.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,.03);
}
.bg-circle--1 { width: 600px; height: 600px; top: -200px; right: -150px; }
.bg-circle--2 { width: 400px; height: 400px; bottom: -100px; left: -100px; background: rgba(255,255,255,.04); }
.bg-circle--3 { width: 200px; height: 200px; top: 40%; left: 20%; }

.login-box {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-10) var(--space-10);
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-lg);
  position: relative;
  z-index: 1;
}

.login-box__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.brand-mark {
  width: 44px; height: 44px;
  background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-700));
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-primary-800);
  line-height: 1;
}
.brand-sub {
  font-size: .75rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.login-box__divider {
  height: 1px;
  background: var(--color-border-light);
  margin-bottom: var(--space-6);
}

.login-box__heading {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-1);
}
.login-box__desc {
  font-size: .875rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-6);
}

.login-form { display: flex; flex-direction: column; gap: var(--space-4); }

.login-error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: var(--color-danger);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-4);
  font-size: .875rem;
}

/* Sessão expirada não é erro do usuário: informa, sem alarme vermelho. */
.login-aviso {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-4);
  font-size: .875rem;
}

.demo-panel {
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border-light);
}
.demo-panel__label {
  font-size: .75rem;
  color: var(--color-text-light);
  text-transform: uppercase;
  letter-spacing: .06em;
  margin-bottom: var(--space-2);
}
.demo-panel__btns { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.demo-btn {
  padding: var(--space-1) var(--space-3);
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: 99px;
  font-size: .75rem;
  font-weight: 500;
  color: var(--color-primary-700);
  cursor: pointer;
  transition: background .15s;
}
.demo-btn:hover { background: var(--color-primary-100); }
</style>

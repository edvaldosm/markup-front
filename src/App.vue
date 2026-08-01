<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useEmpresaStore } from '@/stores/empresa'

const auth = useAuthStore()
const empresa = useEmpresaStore()
const router = useRouter()

// trocar de usuário zera o contexto de empresa: o conjunto autorizado é outro (R09)
watch(() => auth.user?.id, (id) => {
  empresa.reset()
  if (!id) router.push('/login')
})
</script>

<template>
  <RouterView />
</template>

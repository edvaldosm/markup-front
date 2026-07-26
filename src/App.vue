<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

watch(() => auth.user, (user) => {
  if (!user) router.push('/login')
})
</script>

<template>
  <RouterView />
</template>

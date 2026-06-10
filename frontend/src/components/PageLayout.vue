<template>
  <div class="page-wrapper">
    <header class="page-header">
      <div class="header-left">
        <button v-if="showBack" class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
        <h2>{{ title }}</h2>
      </div>
      <div class="header-right">
        <slot name="header-actions" />
      </div>
    </header>
    <main class="page-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  title: { type: String, default: '' }
})

const router = useRouter()
const route = useRoute()

const showBack = computed(() => route.path !== '/')

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.page-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 24px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-left h2 {
  font-size: 22px;
  margin: 0;
  font-weight: 600;
  color: #1e293b;
}
.back-btn {
  background: #f3f4f6;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.back-btn:hover {
  background: #e4e7ed;
  transform: translateX(-2px);
}
.back-icon {
  font-size: 18px;
  color: #4f46e5;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.page-content {
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
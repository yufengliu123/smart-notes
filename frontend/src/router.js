import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('./views/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('./views/Register.vue') },
  { path: '/', name: 'Home', component: () => import('./views/Home.vue'), meta: { requiresAuth: true } },
  { path: '/note/:id', name: 'NoteEditor', component: () => import('./views/NoteEditor.vue'), meta: { requiresAuth: true } },
  { path: '/notes', name: 'NotesList', component: () => import('./views/NotesList.vue'), meta: { requiresAuth: true } },
  { path: '/graph', name: 'KnowledgeGraph', component: () => import('./views/KnowledgeGraph.vue'), meta: { requiresAuth: true } },
  { path: '/review', name: 'Review', component: () => import('./views/Review.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: () => import('./views/Profile.vue'), meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && auth.token) {
    next('/')
  } else {
    next()
  }
})

export default router
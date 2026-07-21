import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/views/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/acervo' },
      { path: 'acervo', name: 'gallery', component: () => import('@/views/GalleryView.vue') },
      { path: 'busca', name: 'search', component: () => import('@/views/SearchView.vue') },
      { path: 'campanhas', name: 'campaigns', component: () => import('@/views/CampaignsView.vue') },
      { path: 'campanhas/:id', name: 'campaign-detail', component: () => import('@/views/CampaignDetailView.vue') },
      { path: 'colecoes', name: 'collections', component: () => import('@/views/CollectionsView.vue') },
      { path: 'colecoes/:id', name: 'collection-detail', component: () => import('@/views/CollectionDetailView.vue') },
      { path: 'favoritos', name: 'favorites', component: () => import('@/views/FavoritesView.vue') },
      { path: 'recentes',  name: 'recentes',  component: () => import('@/views/RecentesView.vue') },
      { path: 'lixeira',   name: 'lixeira',   component: () => import('@/views/LixeiraView.vue') },
      { path: 'tags', name: 'tags', component: () => import('@/views/TagsView.vue'), meta: { requiresEditor: true } },
      { path: 'duplicatas', name: 'duplicates', component: () => import('@/views/DuplicatesView.vue'), meta: { requiresAdmin: true } },
      { path: 'analytics', name: 'analytics', component: () => import('@/views/AnalyticsView.vue'), meta: { requiresAdmin: true } },
      { path: 'status', name: 'status', component: () => import('@/views/StatusView.vue'), meta: { requiresAdmin: true } },
      { path: 'usuarios', name: 'users', component: () => import('@/views/UsersView.vue'), meta: { requiresAdmin: true } },
      { path: 'perfil', name: 'profile', component: () => import('@/views/ProfileView.vue') },
      { path: 'configuracoes', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { requiresAdmin: true } },
      { path: '403', name: 'forbidden', component: () => import('@/views/ForbiddenView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.public) return true
  if (!auth.isAuthenticated) return '/login'
  if (to.meta.requiresAdmin && !auth.isAdmin) return '/403'
  if (to.meta.requiresEditor && !auth.isEditor) return '/403'

  return true
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import SearchPage from '../pages/SearchPage.vue'
import StatusPage from '../pages/StatusPage.vue'
import LoginView from '../views/LoginView.vue'
import UsersPage from '../pages/UsersPage.vue'
import ProfilePage from '../pages/ProfilePage.vue' 

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/perfil', name: 'profile', component: ProfilePage },
    { path: '/usuarios', name: 'users', component: UsersPage },
    { path: '/', name: 'search', component: SearchPage },
    { path: '/status', name: 'status', component: StatusPage },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.path !== '/login' && !token) {
    return next('/login')
  }

  if (to.path === '/login' && token) {
    return next('/')
  }

  next()
})

export default router
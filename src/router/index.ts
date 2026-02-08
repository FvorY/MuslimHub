import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/home'
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/home'
      },
      {
        path: 'home',
        component: () => import('@/modules/home/views/HomeTab.vue')
      },
      {
        path: 'worship',
        component: () => import('@/modules/worship/views/WorshipTab.vue')
      },
      {
        path: 'worship/prayer-times',
        component: () => import('@/modules/worship/views/PrayerTimesPage.vue')
      },
      {
        path: 'worship/dzikir',
        component: () => import('@/modules/worship/views/DzikirPage.vue')
      },
      {
        path: 'worship/tasbih/:type',
        component: () => import('@/modules/worship/views/TasbihCounterPage.vue')
      },
      {
        path: 'worship/qibla',
        component: () => import('@/modules/worship/views/QiblaRedirectPage.vue')
      },
      {
        path: 'quran',
        component: () => import('@/modules/quran/views/QuranTab.vue')
      },
      {
        path: 'quran/surah/:nomor',
        component: () => import('@/modules/quran/views/SurahDetailPage.vue')
      },
      {
        path: 'tools',
        component: () => import('@/modules/tools/views/ToolsTab.vue')
      },
      {
        path: 'tools/zakat',
        component: () => import('@/modules/tools/views/ZakatPage.vue')
      },
      {
        path: 'tools/ramadan',
        component: () => import('@/modules/tools/views/RamadanPage.vue')
      },
      {
        path: 'tools/asmaul-husna',
        component: () => import('@/modules/tools/views/AsmaulHusnaPage.vue')
      },
      {
        path: 'tools/imsyak',
        component: () => import('@/modules/tools/views/ImsyakPage.vue')
      },
      {
        path: 'settings',
        component: () => import('@/modules/settings/views/SettingsTab.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router

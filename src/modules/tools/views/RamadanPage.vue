<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tools"></ion-back-button>
        </ion-buttons>
        <ion-title>Ramadan Companion</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
       <div class="ramadan-hero ion-padding ion-text-center">
         <h1>🌙 Ramadan Kareem</h1>
         <div class="countdown-box">
           <h2>{{ daysLeft }}</h2>
           <p>Days Left (Approx)</p>
         </div>
         <div class="progress-ring">
           <div class="progress-circle" :style="{ background: `conic-gradient(#10b981 0deg, #10b981 ${progressAngle}deg, #e5e7eb ${progressAngle}deg, #e5e7eb 360deg)` }">
             <div class="progress-inner">
               <span class="progress-text">{{ completedTasks }}/{{ totalTasks }}</span>
               <span class="progress-label">Completed</span>
             </div>
           </div>
         </div>
       </div>

       <div class="stats-section ion-padding">
         <div class="stats-grid">
           <div class="stat-card">
             <div class="stat-number">{{ streakDays }}</div>
             <div class="stat-label">Day Streak</div>
           </div>
           <div class="stat-card">
             <div class="stat-number">{{ totalCompleted }}</div>
             <div class="stat-label">Total Tasks</div>
           </div>
         </div>
       </div>

       <div class="checklist-section ion-padding">
         <div class="section-header">
           <h3>Daily Checklist</h3>
           <ion-button fill="clear" size="small" @click="resetDaily">
            <ion-icon :icon="refresh"></ion-icon>
          </ion-button>
         </div>
         <div class="checklist-container">
           <div 
             v-for="item in checklist" 
             :key="item.id" 
             class="checklist-item"
             :class="{ completed: item.checked }"
             @click="toggleItem(item)"
           >
             <div class="checkbox-wrapper">
               <div class="custom-checkbox" :class="{ checked: item.checked }">
                 <ion-icon v-if="item.checked" :icon="checkmark" class="check-icon"></ion-icon>
               </div>
             </div>
             <div class="item-content">
               <div class="item-label">{{ item.label }}</div>
               <div class="item-description">{{ item.description }}</div>
             </div>
             <div class="item-icon">
               <ion-icon :icon="item.icon"></ion-icon>
             </div>
           </div>
         </div>
       </div>

       <div class="history-section ion-padding" v-if="recentHistory.length > 0">
         <h3>Recent Activity</h3>
         <div class="history-list">
           <div v-for="(day, index) in recentHistory" :key="index" class="history-item">
             <div class="history-date">{{ formatDate(day.date) }}</div>
             <div class="history-progress">
               <div class="progress-bar">
                 <div class="progress-fill" :style="{ width: `${(day.completed/day.total) * 100}%` }"></div>
               </div>
               <span class="progress-text">{{ day.completed }}/{{ day.total }}</span>
             </div>
           </div>
         </div>
       </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, IonIcon, onIonViewWillEnter } from '@ionic/vue';
import { computed, ref } from 'vue';
import { StorageService } from '@/shared/services/storage';
import { checkmark, refresh } from 'ionicons/icons';

const STORAGE_KEY = 'ramadan_checklist';
const STORAGE_KEY_HISTORY = 'ramadan_history';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  icon: string;
}

interface HistoryDay {
  date: string;
  completed: number;
  total: number;
}

const checklist = ref<ChecklistItem[]>([
  { id: 'fasting', label: 'Puasa', description: 'Menjalankan puasa Ramadan', checked: false, icon: '🌙' },
  { id: 'prayers', label: 'Sholat 5 Waktu', description: 'Melaksanakan sholat fardhu', checked: false, icon: '🕌' },
  { id: 'tarawih', label: 'Sholat Tarawih', description: 'Sholat sunnah di malam hari', checked: false, icon: '🌟' },
  { id: 'quran', label: 'Membaca Quran', description: 'Tilawah Al-Quran', checked: false, icon: '📖' },
]);

const streakDays = ref(0);
const totalCompleted = ref(0);
const recentHistory = ref<HistoryDay[]>([]);

const daysLeft = computed(() => {
  const ramadanStart = new Date('2026-02-18'); 
  const now = new Date();
  const diffTime = ramadanStart.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

const completedTasks = computed(() => {
  return checklist.value.filter(item => item.checked).length;
});

const totalTasks = computed(() => {
  return checklist.value.length;
});

const progressAngle = computed(() => {
  return (completedTasks.value / totalTasks.value) * 360;
});

const toggleItem = async (item: ChecklistItem) => {
  item.checked = !item.checked;
  await saveChecklist();
  await updateHistory();
};

const resetDaily = async () => {
  checklist.value.forEach(item => item.checked = false);
  await saveChecklist();
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const loadChecklist = async () => {
  const savedData = await StorageService.get<{ date: string, items: ChecklistItem[] }>(STORAGE_KEY);
  const today = new Date().toISOString().split('T')[0];

  if (savedData) {
    if (savedData.date === today) {
      // Map saved items to our reactive ref
      savedData.items.forEach(savedItem => {
        const item = checklist.value.find(i => i.id === savedItem.id);
        if (item) item.checked = savedItem.checked;
      });
    } else {
      // Different day, reset checklist and save new date
      checklist.value.forEach(item => item.checked = false);
      await saveChecklist();
    }
  } else {
    // First time, save initial state
    await saveChecklist();
  }

  await loadHistory();
};

const saveChecklist = async () => {
  const today = new Date().toISOString().split('T')[0];
  await StorageService.set(STORAGE_KEY, {
    date: today,
    items: checklist.value.map(item => ({ 
      id: item.id, 
      checked: item.checked,
      label: item.label,
      description: item.description,
      icon: item.icon
    }))
  });
};

const loadHistory = async () => {
  const history = await StorageService.get<HistoryDay[]>(STORAGE_KEY_HISTORY) || [];
  recentHistory.value = history.slice(-7); // Show last 7 days
  
  // Calculate stats
  streakDays.value = calculateStreak(history);
  totalCompleted.value = history.reduce((sum, day) => sum + day.completed, 0);
};

const updateHistory = async () => {
  const today = new Date().toISOString().split('T')[0];
  const history = await StorageService.get<HistoryDay[]>(STORAGE_KEY_HISTORY) || [];
  
  const todayIndex = history.findIndex(day => day.date === today);
  const todayData = {
    date: today,
    completed: completedTasks.value,
    total: totalTasks.value
  };

  if (todayIndex >= 0) {
    history[todayIndex] = todayData;
  } else {
    history.push(todayData);
  }

  // Keep only last 30 days
  const filteredHistory = history.slice(-30);
  await StorageService.set(STORAGE_KEY_HISTORY, filteredHistory);
  
  recentHistory.value = filteredHistory.slice(-7);
  streakDays.value = calculateStreak(filteredHistory);
  totalCompleted.value = filteredHistory.reduce((sum, day) => sum + day.completed, 0);
};

const calculateStreak = (history: HistoryDay[]): number => {
  if (history.length === 0) return 0;
  
  // Sort by date descending
  const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  
  for (const day of sorted) {
    if (day.completed === day.total) {
      streak++;
    } else {
      break;
    }
    if (day.date === today) continue;
  }
  
  return streak;
};

onIonViewWillEnter(() => {
  loadChecklist();
});
</script>

<style scoped>
.ramadan-hero {
  background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
  color: white;
  padding: 40px 20px;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
}

.ramadan-hero h1 {
  font-size: 1.4rem;
  font-weight: 500;
  opacity: 0.9;
  margin-bottom: 20px;
}

.countdown-box h2 {
  font-size: 5rem;
  font-weight: 800;
  margin: 0;
  line-height: 1;
}

.countdown-box p {
  font-size: 1.1rem;
  opacity: 0.8;
  margin-top: 10px;
}

.progress-ring {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

.progress-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.progress-inner {
  width: 90px;
  height: 90px;
  background: white;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.progress-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: #10b981;
}

.progress-label {
  font-size: 0.7rem;
  color: #6b7280;
  margin-top: 2px;
}

.stats-section {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.stat-number {
  font-size: 2rem;
  font-weight: 800;
  color: #10b981;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
}

.checklist-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.checklist-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checklist-item:last-child {
  border-bottom: none;
}

.checklist-item:hover {
  background: #f9fafb;
}

.checklist-item.completed {
  opacity: 0.7;
}

.checklist-item.completed .item-label {
  text-decoration: line-through;
  color: #6b7280;
}

.checkbox-wrapper {
  margin-right: 16px;
}

.custom-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.custom-checkbox.checked {
  background: #10b981;
  border-color: #10b981;
}

.check-icon {
  color: white;
  font-size: 16px;
}

.item-content {
  flex: 1;
}

.item-label {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.item-description {
  font-size: 0.85rem;
  color: #6b7280;
}

.item-icon {
  margin-left: 16px;
  font-size: 1.2rem;
}

.history-section {
  padding: 20px;
}

.history-section h3 {
  margin-bottom: 16px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
}

.history-list {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.history-item:last-child {
  border-bottom: none;
}

.history-date {
  font-weight: 500;
  color: #1f2937;
  min-width: 60px;
}

.history-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  margin-left: 16px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #10b981;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.85rem;
  color: #6b7280;
  min-width: 40px;
  text-align: right;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .stats-grid,
  .checklist-container,
  .history-list {
    background: #1f2937;
  }
  
  .stat-card {
    background: #374151;
  }
  
  .section-header h3,
  .history-section h3,
  .item-label,
  .history-date {
    color: #f9fafb;
  }
  
  .stat-label,
  .item-description,
  .progress-text {
    color: #d1d5db;
  }
  
  .checklist-item:hover {
    background: #374151;
  }
  
  .checklist-item.completed .item-label {
    color: #9ca3af;
  }
}
</style>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tools"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('tools.imsyak_schedule') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="content-wrapper">
        <div class="selection-section">
          <div class="selection-card">
            <h3>{{ t('tools.select_province') }}</h3>
            <ion-item>
              <ion-select 
                v-model="selectedProvince" 
                :placeholder="t('tools.select_province')"
                @ionChange="onProvinceChange"
                :disabled="loadingProvinces || detectingLocation"
              >
                <ion-select-option 
                  v-for="province in provinces" 
                  :key="province" 
                  :value="province"
                >
                  {{ province }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </div>

          <div class="selection-card" v-if="selectedProvince">
            <h3>{{ t('tools.select_city') }}</h3>
            <ion-item>
              <ion-select 
                v-model="selectedCity" 
                :placeholder="t('tools.select_city')"
                @ionChange="onCityChange"
                :disabled="loadingCities || detectingLocation"
              >
                <ion-select-option 
                  v-for="city in cities" 
                  :key="city" 
                  :value="city"
                >
                  {{ city }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </div>

          <ion-button 
            expand="block" 
            class="detect-location-button" 
            @click="detectAndLoadLocation"
            :disabled="detectingLocation"
          >
            <ion-spinner v-if="detectingLocation" name="crescent"></ion-spinner>
            <ion-icon v-else :icon="locateOutline"></ion-icon>
            {{ t('tools.detect_location_auto') }}
          </ion-button>
        </div>

        <div class="schedule-section" v-if="imsyakData && !loading && !detectingLocation">
          <div class="schedule-card">
            <h2>{{ imsyakData?.provinsi }}</h2>
            <p>{{ imsyakData?.kabkota }}</p>
            <div class="hijri-year">
              {{ t('tools.ramadan') }} {{ imsyakData?.hijriah }} H / {{ imsyakData?.masehi }} M
            </div>

            <div class="schedule-grid">
              <div 
                v-for="day in imsyakData?.imsakiyah" 
                :key="day.tanggal" 
                class="day-card"
                :class="{ 'today': isToday(day.tanggal) }"
              >
                <div class="day-date">{{ day.tanggal }}</div>
                <div class="prayer-times">
                  <div class="prayer-item">
                    <span>{{ t('prayers.imsyak') }}</span>
                    <span>{{ day.imsak }}</span>
                  </div>
                  <div class="prayer-item">
                    <span>{{ t('prayers.subuh') }}</span>
                    <span>{{ day.subuh }}</span>
                  </div>
                  <div class="prayer-item">
                    <span>{{ t('prayers.dzuhur') }}</span>
                    <span>{{ day.dzuhur }}</span>
                  </div>
                  <div class="prayer-item">
                    <span>{{ t('prayers.ashar') }}</span>
                    <span>{{ day.ashar }}</span>
                  </div>
                  <div class="prayer-item">
                    <span>{{ t('prayers.maghrib') }}</span>
                    <span>{{ day.maghrib }}</span>
                  </div>
                  <div class="prayer-item">
                    <span>{{ t('prayers.isya') }}</span>
                    <span>{{ day.isya }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading || detectingLocation" class="loading-spinner">
          <ion-spinner name="crescent"></ion-spinner>
          <p>{{ detectingLocation ? t('tools.detecting_location') : t('tools.loading_schedule') }}</p>
        </div>

        <div v-if="error" class="error-message">
          <ion-icon :icon="warning"></ion-icon>
          <p>{{ error }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonIcon,
  IonButton,
} from '@ionic/vue';
import { warning, locateOutline } from 'ionicons/icons';
import { ImsyakApiService, type ImsyakScheduleResponse } from '../services/imsyak-api';
import { StorageService } from '@/shared/services/storage';
import { SmartLocationService } from '@/shared/services/smart-location';
import { GeocodingService } from '@/shared/services/geocoding';

const { t } = useI18n();

const STORAGE_KEY = 'imsyak_preferences';

const provinces = ref<string[]>([]);
const cities = ref<string[]>([]);
const selectedProvince = ref<string>('');
const selectedCity = ref<string>('');
const loadingProvinces = ref(false);
const loadingCities = ref(false);
const loading = ref(false);
const detectingLocation = ref(false); // New loading state for location detection
const error = ref<string>('');
const imsyakData = ref<ImsyakScheduleResponse['data'] | null>(null);

const detectAndLoadLocation = async () => {
  detectingLocation.value = true;
  error.value = '';
  try {
    console.log('Detecting location...');
    const locationResult = await SmartLocationService.getLocation();

    if (locationResult.latitude && locationResult.longitude) {
      console.log('Location detected:', locationResult);
      const geocoded = await GeocodingService.reverseGeocode(locationResult.latitude, locationResult.longitude);

      if (geocoded) {
          console.log('Geocoded location:', geocoded);
        const detectedProvince = geocoded.province;
        const detectedCity = geocoded.city;

        // Set the province in the UI
        selectedProvince.value = detectedProvince;

        // Load the list of cities for the detected province
        loadingCities.value = true;
        const validCities = await ImsyakApiService.getCities(detectedProvince);
        cities.value = validCities;
        loadingCities.value = false;

        // Find the best match for the detected city in the valid list
        const matchedCity = validCities.find(c => c.toLowerCase().includes(detectedCity.toLowerCase()));

        if (matchedCity) {
          // If a match is found, set it and load the schedule
          selectedCity.value = matchedCity;
          await loadImsyakSchedule();
          await savePreferences();
        } else {
          // If no city matches, inform the user to select manually
          error.value = t('tools.error_city_not_found', { city: detectedCity, province: detectedProvince });
          selectedCity.value = ''; // Clear city selection
        }
      } else {
        error.value = t('tools.error_location_info');
      }
    } else {
      error.value = t('tools.error_detect_location');
    }
  } catch (err) {
    console.error('Error detecting and loading location:', err);
    error.value = t('tools.error_general_location');
  } finally {
    detectingLocation.value = false;
  }
};

const loadProvinces = async () => {
  loadingProvinces.value = true;
  try {
    console.log('Fetching provinces...');
    provinces.value = await ImsyakApiService.getProvinces();
    console.log('Provinces fetched:', provinces.value);
  } catch (err) {
    console.error('Error loading provinces:', err);
    error.value = 'Gagal memuat daftar provinsi';
  } finally {
    loadingProvinces.value = false;
  }
};

const onProvinceChange = async () => {
  if (!selectedProvince.value) return;
  
  console.log('Province changed to:', selectedProvince.value);
  cities.value = [];
  selectedCity.value = '';
  imsyakData.value = null;
  
  loadingCities.value = true;
  try {
    console.log('Fetching cities for province:', selectedProvince.value);
    cities.value = await ImsyakApiService.getCities(selectedProvince.value);
    console.log('Cities fetched:', cities.value);
  } catch (err) {
    console.error('Error loading cities:', err);
    error.value = 'Gagal memuat daftar kabupaten/kota';
  } finally {
    loadingCities.value = false;
  }
};

const onCityChange = async () => {
  if (!selectedCity.value) return;
  
  console.log('City changed to:', selectedCity.value);
  await loadImsyakSchedule();
  await savePreferences();
};

const loadImsyakSchedule = async () => {
  if (!selectedProvince.value || !selectedCity.value) {
    console.log('Cannot load imsyak schedule: province or city not selected.', { province: selectedProvince.value, city: selectedCity.value });
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    console.log('Fetching imsyak schedule for:', { province: selectedProvince.value, city: selectedCity.value });
    const response = await ImsyakApiService.getImsyakSchedule(selectedProvince.value, selectedCity.value);
    console.log('Imsyak schedule response:', response);
    imsyakData.value = response.data;
    console.log('Imsyak data assigned:', imsyakData.value);
  } catch (err) {
    console.error('Error loading imsak schedule:', err);
    error.value = 'Gagal memuat jadwal imsak';
  } finally {
    loading.value = false;
  }
};

const savePreferences = async () => {
  if (selectedProvince.value && selectedCity.value) {
    console.log('Saving preferences:', { province: selectedProvince.value, city: selectedCity.value });
    await StorageService.set(STORAGE_KEY, {
      province: selectedProvince.value,
      city: selectedCity.value,
    });
  }
};

const loadPreferences = async () => {
  console.log('Loading preferences...');
  const preferences = await StorageService.get<{ province: string; city: string }>(STORAGE_KEY);
  console.log('Loaded preferences:', preferences);
  if (preferences) {
    selectedProvince.value = preferences.province;
    selectedCity.value = preferences.city;
  }
};

const isToday = (tanggal: number): boolean => {
  const today = new Date();
  const currentDate = today.getDate();
  return tanggal === currentDate;
};

onMounted(async () => {
    console.log('Component mounted. Loading provinces...');
    await loadProvinces();
    console.log('Provinces loaded. Loading preferences...');
  await loadPreferences();
  
  if (selectedProvince.value && selectedCity.value) {
    console.log('Preferences found. Initializing with:', { province: selectedProvince.value, city: selectedCity.value });
    await onProvinceChange(); // This will load cities for the selected province
    await loadImsyakSchedule(); // This will load the schedule for the selected city
  } else {
    console.log('No saved preferences or incomplete preferences. Attempting to detect location...');
    await detectAndLoadLocation();
  }
});
</script>

<style scoped>
.content-wrapper {
  padding: 16px;
}

.selection-section {
  margin-bottom: 24px;
}

.selection-card {
  background: var(--ion-card-background, #fff);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  transition: background-color 0.3s;
}

.selection-card h3 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

ion-item {
  --background: var(--ion-color-step-150, #f2f2f2);
  --border-radius: 8px;
  --border-color: var(--ion-border-color);
  --highlight-color-focused: transparent;
  --highlight-color-valid: transparent;
  --highlight-color-invalid: transparent;
  --padding-start: 0;
  --inner-padding-end: 0;
  transition: background-color 0.3s;
}

ion-select {
  width: 100%;
  padding-left: 12px;
  padding-right: 12px;
}

.detect-location-button {
  --background: var(--ion-color-primary);
  --background-activated: var(--ion-color-primary-shade);
  --color: white;
  margin-top: 8px;
  font-weight: 600;
}

.schedule-section {
  margin-top: 24px;
}

.schedule-card {
  background: linear-gradient(135deg, #059669 0%, #14b8a6 100%);
  color: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.schedule-card h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 900;
  letter-spacing: -0.5px;
}

.schedule-card p {
  margin: 4px 0 0;
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0.9;
}

.hijri-year {
  font-size: 0.9rem;
  font-weight: 400;
  opacity: 0.7;
  margin-top: 8px;
  margin-bottom: 20px;
}

.schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.day-card {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 16px;
  text-align: left;
  transition: all 0.2s ease;
}

.day-card.today {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  transform: translateY(-5px);
}

.day-date {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: white;
}

.prayer-times .prayer-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  margin-bottom: 6px;
  color: rgba(255, 255, 255, 0.8);
}

.prayer-times .prayer-item span:first-child {
  font-weight: 500;
}

.prayer-times .prayer-item span:last-child {
  font-weight: 700;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--ion-color-medium);
}

.loading-spinner ion-spinner {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--ion-color-danger);
  text-align: center;
  padding: 20px;
}

.error-message ion-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.error-message p {
  margin: 0;
  font-size: 1rem;
}

/* Dark Mode Styles */
@media (prefers-color-scheme: dark) {
  .selection-card {
    background: var(--ion-color-step-100, #2c2c2e);
  }

  ion-item {
    --background: var(--ion-color-step-250, #3a3a3c);
  }

  .selection-card h3 {
    color: var(--ion-text-color);
  }
}
</style>

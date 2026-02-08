<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tools"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('tools.zakat_calculator') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div class="ion-padding">
        <ion-segment v-model="segment" value="income">
          <ion-segment-button value="income">
            <ion-label>{{ t('tools.income') }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="asset">
            <ion-label>{{ t('tools.gold_silver') }}</ion-label>
          </ion-segment-button>
        </ion-segment>

        <div class="calculator-content ion-margin-top" v-if="segment === 'income'">
          <ion-item>
            <ion-label position="stacked">{{ t('tools.monthly_income') }} (IDR)</ion-label>
            <ion-input type="text" inputmode="numeric" :value="incomeDisplay" @ionInput="onIncomeInput" placeholder="e.g. 10.000.000"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">{{ t('tools.other_income') }}</ion-label>
            <ion-input type="text" inputmode="numeric" :value="otherIncomeDisplay" @ionInput="onOtherIncomeInput" placeholder="e.g. 5.000.000"></ion-input>
          </ion-item>
           <div class="result-box ion-margin-top">
             <p>{{ t('tools.total_zakat_per_month') }}:</p>
             <h2>{{ formatCurrency(totalZakatIncome) }}</h2>
             <small>{{ t('tools.percentage_of_total_income') }}</small>
           </div>
        </div>

        <div class="calculator-content ion-margin-top" v-if="segment === 'asset'">
          <ion-segment v-model="assetType" value="gold" layout="compact">
            <ion-segment-button value="gold">
              <ion-label>{{ t('tools.gold') }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="silver">
              <ion-label>{{ t('tools.silver') }}</ion-label>
            </ion-segment-button>
          </ion-segment>

          <ion-item class="ion-margin-top">
            <ion-label position="stacked">{{ t('tools.calculation_standard') }}</ion-label>
            <ion-select 
              v-model="calculationStandard"
              interface="popover" 
              :placeholder="t('tools.calculation_standard')">
              <ion-select-option value="classical">{{ t('tools.classical_standard') }}</ion-select-option>
              <ion-select-option value="common">{{ t('tools.common_standard') }}</ion-select-option>
            </ion-select>
          </ion-item>

          <div v-if="assetType === 'gold'">
            <ion-item>
              <ion-label position="stacked">{{ t('tools.gold_grams') }}</ion-label>
              <ion-input type="text" inputmode="numeric" :value="goldWeightDisplay" @ionInput="onGoldWeightInput" placeholder="0"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">{{ t('tools.gold_price_per_gram') }}</ion-label>
              <ion-input type="text" inputmode="numeric" :value="goldPriceDisplay" @ionInput="onGoldPriceInput" :placeholder="t('common.loading')"></ion-input>
              <template #end>
                <ion-spinner v-if="isLoadingNisab" name="dots"></ion-spinner>
              </template>
            </ion-item>
          </div>

          <div v-if="assetType === 'silver'">
            <ion-item>
              <ion-label position="stacked">{{ t('tools.silver_grams') }}</ion-label>
              <ion-input type="text" inputmode="numeric" :value="silverWeightDisplay" @ionInput="onSilverWeightInput" placeholder="0"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">{{ t('tools.silver_price_per_gram') }}</ion-label>
              <ion-input type="text" inputmode="numeric" :value="silverPriceDisplay" @ionInput="onSilverPriceInput" :placeholder="t('common.loading')"></ion-input>
              <template #end>
                <ion-spinner v-if="isLoadingNisab" name="dots"></ion-spinner>
              </template>
            </ion-item>
          </div>

           <div class="result-box ion-margin-top">
             <p v-if="assetType === 'gold'">{{ t('tools.zakat_mal_gold') }}:</p>
             <p v-else>{{ t('tools.zakat_mal_silver') }}:</p>
             <h2>{{ formatCurrency(totalZakatAsset) }}</h2>
             <small v-if="assetType === 'gold'">{{ t('tools.percentage_if_more_than_85g', { weight: goldNisabWeight }) }}</small>
             <small v-else>{{ t('tools.percentage_if_more_than_85g', { weight: silverNisabWeight }) }}</small>
           </div>
        </div>
        
        <div class="info-nisab ion-padding ion-margin-top text-muted">
           <p><strong>{{ t('tools.nisab_info') }}:</strong></p>
           <p>{{ t('tools.income_zakat_info') }}</p>
           <p>{{ t('tools.gold_nisab_info', { weight: goldNisabWeight }) }}</p>
           <p>{{ t('tools.silver_nisab_info', { weight: silverNisabWeight }) }}</p>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonItem, IonInput, IonSpinner, IonSelect, IonSelectOption } from '@ionic/vue';
import { ref, computed, onMounted, watch } from 'vue';
import { ZakatNisabService } from '@/shared/services/zakat-nisab-service';
import { formatThousand, parseThousand, formatCurrency } from '@/shared/utils/number';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface NisabData {
  gold: {
    weight: number;
    unit_price: number;
    nisab_amount: number;
  };
  silver: {
    weight: number;
    unit_price: number;
    nisab_amount: number;
  };
}

const segment = ref('income');
const assetType = ref('gold'); // 'gold' or 'silver'
const calculationStandard = ref('classical'); // 'classical' or 'common'

const income = ref<number | null>(null);
const otherIncome = ref<number | null>(null);
const goldWeight = ref<number | null>(null);
const goldPrice = ref<number>(0); // Default price, will be fetched
const silverWeight = ref<number | null>(null);
const silverPrice = ref<number>(0); // Default price, will be fetched
const isLoadingNisab = ref(false);
const nisabData = ref<NisabData | null>(null);

const incomeDisplay = ref('');
const otherIncomeDisplay = ref('');
const goldWeightDisplay = ref('');
const goldPriceDisplay = ref('');
const silverWeightDisplay = ref('');
const silverPriceDisplay = ref('');

const goldNisabWeight = computed(() => calculationStandard.value === 'common' ? 85 : 87.48);
const silverNisabWeight = computed(() => calculationStandard.value === 'common' ? 595 : 612.36);

const onIncomeInput = (ev: any) => {
  const value = ev.target.value;
  income.value = parseThousand(value);
  incomeDisplay.value = formatThousand(income.value);
};

const onOtherIncomeInput = (ev: any) => {
  const value = ev.target.value;
  otherIncome.value = parseThousand(value);
  otherIncomeDisplay.value = formatThousand(otherIncome.value);
};

const onGoldWeightInput = (ev: any) => {
  const value = ev.target.value;
  goldWeight.value = parseThousand(value);
  goldWeightDisplay.value = formatThousand(goldWeight.value);
};

const onGoldPriceInput = (ev: any) => {
  const value = ev.target.value;
  goldPrice.value = parseThousand(value) || 0;
  goldPriceDisplay.value = formatThousand(goldPrice.value);
};

const onSilverWeightInput = (ev: any) => {
  const value = ev.target.value;
  silverWeight.value = parseThousand(value);
  silverWeightDisplay.value = formatThousand(silverWeight.value);
};

const onSilverPriceInput = (ev: any) => {
  const value = ev.target.value;
  silverPrice.value = parseThousand(value) || 0;
  silverPriceDisplay.value = formatThousand(silverPrice.value);
};


// Cleaned up - using v-model instead of event handlers

const fetchNisabData = async (forceRefresh: boolean = false) => {
  isLoadingNisab.value = true;
  try {
    nisabData.value = await ZakatNisabService.getNisab('idr', 'g', calculationStandard.value, forceRefresh);
    
    if (nisabData.value) {
      if (nisabData.value.gold && nisabData.value.gold.unit_price) {
        goldPrice.value = nisabData.value.gold.unit_price;
        goldPriceDisplay.value = formatThousand(goldPrice.value);
      } else {
        goldPrice.value = 0;
        goldPriceDisplay.value = formatThousand(goldPrice.value);
      }
      if (nisabData.value.silver && nisabData.value.silver.unit_price) {
        silverPrice.value = nisabData.value.silver.unit_price;
        silverPriceDisplay.value = formatThousand(silverPrice.value);
      } else {
        silverPrice.value = 0;
        silverPriceDisplay.value = formatThousand(silverPrice.value);
      }
    } else {
      goldPrice.value = 0;
      goldPriceDisplay.value = formatThousand(goldPrice.value);
      silverPrice.value = 0;
      silverPriceDisplay.value = formatThousand(silverPrice.value);
    }
  } catch (error) {
    console.error('Error in ZakatPage fetching nisab data:', error);
    goldPrice.value = 0;
    goldPriceDisplay.value = formatThousand(goldPrice.value);
    silverPrice.value = 0;
    silverPriceDisplay.value = formatThousand(silverPrice.value);
  } finally {
    isLoadingNisab.value = false;
    console.log('=== fetchNisabData COMPLETED ===');
  }
};

onMounted(() => {
  fetchNisabData(false);
});

const totalZakatIncome = computed(() => {
  const total = (Number(income.value) || 0) + (Number(otherIncome.value) || 0);
  return total * 0.025;
});

const totalZakatAsset = computed(() => {
      if (assetType.value === 'gold') {
        const weight = Number(goldWeight.value) || 0;
        const nisabWeight = Number(goldNisabWeight.value);
        if (!nisabWeight || weight <= nisabWeight) return 0;
        return weight * Number(goldPrice.value) * 0.025;
      } else { // silver
        const weight = Number(silverWeight.value) || 0;
        const nisabWeight = Number(silverNisabWeight.value);
        if (!nisabWeight || weight <= nisabWeight) return 0;
        return weight * Number(silverPrice.value) * 0.025;
      }
    });

watch(calculationStandard, (newValue, oldValue) => {
  if (newValue && newValue !== oldValue) {
    fetchNisabData(true);
  }
}, { immediate: true });
</script>

<style scoped>
.result-box {
  background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
  color: white;
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
}
.result-box h2 {
  font-size: 2.2rem;
  font-weight: 800;
  margin: 12px 0;
}
.text-muted {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}
</style>

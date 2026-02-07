<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tools"></ion-back-button>
        </ion-buttons>
        <ion-title>Zakat Calculator</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div class="ion-padding">
        <ion-segment v-model="segment" value="income">
          <ion-segment-button value="income">
            <ion-label>Income</ion-label>
          </ion-segment-button>
          <ion-segment-button value="gold">
            <ion-label>Gold/Silver</ion-label>
          </ion-segment-button>
        </ion-segment>

        <div class="calculator-content ion-margin-top" v-if="segment === 'income'">
          <ion-item>
            <ion-label position="stacked">Monthly Income (IDR)</ion-label>
            <ion-input type="text" inputmode="numeric" :value="incomeDisplay" @ionInput="onIncomeInput" placeholder="e.g. 10.000.000"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Other Income (Bonus/Thr)</ion-label>
            <ion-input type="text" inputmode="numeric" :value="otherIncomeDisplay" @ionInput="onOtherIncomeInput" placeholder="e.g. 5.000.000"></ion-input>
          </ion-item>
           <div class="result-box ion-margin-top">
             <p>Total Zakat Per Month:</p>
             <h2>{{ formatCurrency(totalZakatIncome) }}</h2>
             <small>2.5% of Total Income</small>
           </div>
        </div>

        <div class="calculator-content ion-margin-top" v-if="segment === 'gold'">
          <ion-item>
            <ion-label position="stacked">Gold (Grams)</ion-label>
            <ion-input type="text" inputmode="numeric" :value="goldWeightDisplay" @ionInput="onGoldWeightInput" placeholder="0"></ion-input>
          </ion-item>
           <ion-item>
            <ion-label position="stacked">Current Gold Price / Gram</ion-label>
            <ion-input type="text" inputmode="numeric" :value="goldPriceDisplay" @ionInput="onGoldPriceInput" placeholder="Loading price..."></ion-input>
            <ion-spinner v-if="isLoadingGold" slot="end" name="dots"></ion-spinner>
          </ion-item>
           <div class="result-box ion-margin-top">
             <p>Zakat Mal (Gold):</p>
             <h2>{{ formatCurrency(totalZakatGold) }}</h2>
             <small>2.5% if > 85g</small>
           </div>
        </div>
        
        <div class="info-nisab ion-padding ion-margin-top text-muted">
           <p><strong>Nisab Info:</strong></p>
           <p>Income Zakat: 2.5% calculated monthly/annually.</p>
           <p>Gold Nisab: 85 grams.</p>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonItem, IonInput, IonSpinner } from '@ionic/vue';
import { ref, computed, onMounted, watch } from 'vue';
import { GoldService } from '@/shared/services/gold';
import { formatThousand, parseThousand, formatCurrency } from '@/shared/utils/number';

const segment = ref('income');
const income = ref<number | null>(null);
const otherIncome = ref<number | null>(null);
const goldWeight = ref<number | null>(null);
const goldPrice = ref<number>(1200000); // Default price
const isLoadingGold = ref(false);

const incomeDisplay = ref('');
const otherIncomeDisplay = ref('');
const goldWeightDisplay = ref('');
const goldPriceDisplay = ref(formatThousand(1200000));

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

const fetchGoldPrice = async () => {
  isLoadingGold.value = true;
  try {
    const price = await GoldService.getGoldPrice();
    goldPrice.value = price;
    goldPriceDisplay.value = formatThousand(price);
  } catch (error) {
    console.error('Error in ZakatPage fetching gold price:', error);
  } finally {
    isLoadingGold.value = false;
  }
};

onMounted(() => {
  fetchGoldPrice();
});

const totalZakatIncome = computed(() => {
  const total = (Number(income.value) || 0) + (Number(otherIncome.value) || 0);
  return total * 0.025;
});

const totalZakatGold = computed(() => {
  const weight = Number(goldWeight.value) || 0;
  if (weight < 85) return 0;
  return weight * Number(goldPrice.value) * 0.025;
});
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

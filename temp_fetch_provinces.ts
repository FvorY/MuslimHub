import { ImsyakApiService } from './src/modules/tools/services/imsyak-api';

async function fetchProvinces() {
  try {
    const provinces = await ImsyakApiService.getProvinces();
    console.log('Valid Provinces from EQuran.id API:', provinces);
  } catch (error) {
    console.error('Error fetching provinces:', error);
  }
}

fetchProvinces();

export interface ImsyakProvinceResponse {
  code: number;
  message: string;
  data: string[];
}

export interface ImsyakCityRequest {
  provinsi: string;
}

export interface ImsyakCityResponse {
  code: number;
  message: string;
  data: string[];
}

export interface ImsyakScheduleRequest {
  provinsi: string;
  kabkota: string;
}

export interface ImsyakSchedule {
  tanggal: number;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}

export interface ImsyakScheduleResponse {
  code: number;
  message: string;
  data: {
    provinsi: string;
    kabkota: string;
    hijriah: string;
    masehi: string;
    imsakiyah: ImsyakSchedule[];
  };
}

const API_BASE_URL = 'https://equran.id/api/v2/imsakiyah';

export const ImsyakApiService = {
  async getProvinces(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/provinsi`);
      const data: ImsyakProvinceResponse = await response.json();
      
      if (data.code === 200) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch provinces');
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
      throw error;
    }
  },



  async getCities(province: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/kabkota`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provinsi: province } as ImsyakCityRequest),
      });
      
      const data: ImsyakCityResponse = await response.json();
      
      if (data.code === 200) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch cities');
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }
  },

  async getImsyakSchedule(province: string, city: string): Promise<ImsyakScheduleResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provinsi: province, kabkota: city } as ImsyakScheduleRequest),
      });
      
      const data: ImsyakScheduleResponse = await response.json();
      
      if (data.code === 200) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to fetch imsak schedule');
      }
    } catch (error) {
      console.error('Error fetching imsak schedule:', error);
      throw error;
    }
  }
};
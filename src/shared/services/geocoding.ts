import axios from 'axios';

interface BigDataCloudResponse {
  latitude: number;
  longitude: number;
  localityLanguageRequested: string;
  continent: string;
  continentCode: string;
  countryName: string;
  countryCode: string;
  principalSubdivision: string; // This is likely the province
  principalSubdivisionCode: string;
  city: string; // This is likely the city/kabkota
  locality: string;
  postcode: string;
  localityInfo: {
    administrative: Array<{
      name: string;
      description: string;
      isoName: string;
      order: number;
      adminLevel: number;
      wikidataId: string;
    }>;
    // ... other fields
  };
}

export interface GeocodedLocation {
  province: string;
  city: string;
}

export const GeocodingService = {
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodedLocation | null> {
    try {
      const response = await axios.get<BigDataCloudResponse>(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
      );

      const data = response.data;

      if (data && data.localityInfo && data.localityInfo.administrative) {
        const adminInfo = data.localityInfo.administrative;
        
        const provinceInfo = adminInfo.find(item => item.adminLevel === 4);
        const cityInfo = adminInfo.find(item => item.adminLevel === 5);

        if (provinceInfo && cityInfo) {
          return {
            province: provinceInfo.name,
            city: cityInfo.name,
          };
        }
      }

      // Fallback to the old method if the new one fails
      if (data && data.principalSubdivision && data.city) {
        return {
          province: data.principalSubdivision,
          city: data.city,
        };
      } else if (data && data.principalSubdivision && data.locality) {
        // Fallback to locality if city is not available
        return {
          province: data.principalSubdivision,
          city: data.locality,
        };
      }
      return null;
    } catch (error) {
      console.error('Error during reverse geocoding:', error);
      return null;
    }
  },
};

import { loadGoogleMaps } from '../utils/googleMapsLoader';

export interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  distance: number;
  address: string;
  rating?: number;
  latitude: number;
  longitude: number;
}

export type PlaceCategory = 'hospital' | 'airport' | 'railway_station' | 'government_office' | 'restaurant';

const PLACE_TYPE_MAPPING: Record<PlaceCategory, string[]> = {
  hospital: ['hospital', 'doctor', 'health'],
  airport: ['airport'],
  railway_station: ['train_station', 'transit_station'],
  government_office: ['local_government_office', 'post_office'],
  restaurant: ['restaurant', 'cafe', 'food'],
};

class NearbyPlacesService {
  async getNearbyPlaces(
    latitude: number,
    longitude: number,
    category: PlaceCategory,
    radiusMeters: number = 5000
  ): Promise<NearbyPlace[]> {
    try {
      const google = await loadGoogleMaps();
      const location = new google.maps.LatLng(latitude, longitude);

      const placesService = new google.maps.places.PlacesService(
        document.createElement('div')
      );

      const types = PLACE_TYPE_MAPPING[category] || [];
      const allResults: NearbyPlace[] = [];

      for (const type of types) {
        const results = await new Promise<google.maps.places.PlaceResult[]>(
          (resolve, reject) => {
            placesService.nearbySearch(
              {
                location,
                radius: radiusMeters,
                type,
              },
              (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                  resolve(results);
                } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                  resolve([]);
                } else {
                  reject(new Error(`Places API error: ${status}`));
                }
              }
            );
          }
        );

        results.forEach((place) => {
          if (place.geometry?.location && place.place_id && place.name) {
            const placeLat = place.geometry.location.lat();
            const placeLng = place.geometry.location.lng();
            const distance = this.calculateDistance(latitude, longitude, placeLat, placeLng);

            allResults.push({
              id: place.place_id,
              name: place.name,
              type: category,
              distance: Math.round(distance * 10) / 10,
              address: place.vicinity || '',
              rating: place.rating,
              latitude: placeLat,
              longitude: placeLng,
            });
          }
        });
      }

      const uniquePlaces = Array.from(
        new Map(allResults.map((p) => [p.id, p])).values()
      );

      return uniquePlaces.sort((a, b) => a.distance - b.distance).slice(0, 10);
    } catch (error) {
      console.error(`Failed to fetch ${category} places:`, error);
      return [];
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const nearbyPlacesService = new NearbyPlacesService();

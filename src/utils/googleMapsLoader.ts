import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance: Loader | null = null;
let isLoading = false;
let isLoaded = false;

export const loadGoogleMaps = async (): Promise<typeof google> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    throw new Error('Google Maps API key not configured');
  }

  if (isLoaded && window.google) {
    return window.google;
  }

  if (isLoading) {
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (window.google) return window.google;
  }

  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geocoding'],
    });
  }

  isLoading = true;
  try {
    await (loaderInstance as unknown as { load: () => Promise<void> }).load();
    isLoaded = true;
    return window.google;
  } finally {
    isLoading = false;
  }
};

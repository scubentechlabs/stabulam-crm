import { useState, useCallback } from 'react';

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options;

  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPosition = useCallback(async (): Promise<GeolocationPosition | null> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return null;
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const location: GeolocationPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          };
          setPosition(location);
          setIsLoading(false);
          resolve(location);
        },
        (err) => {
          let errorMessage = 'Failed to get location';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case err.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          setError(errorMessage);
          setIsLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  return {
    position,
    isLoading,
    error,
    getPosition,
  };
}

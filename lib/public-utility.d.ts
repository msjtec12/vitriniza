export interface PublicUtilityLocation {
  latitude?: number;
  longitude?: number;
  address?: string;
  number?: string;
  neighborhood_name?: string;
  city_name?: string;
  state_id?: string;
}

export function normalizeExternalUrl(value?: string): string | null;
export function buildMapsDirectionsUrl(location: PublicUtilityLocation): string;

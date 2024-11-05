export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type GeoInfo = {
  coords: Coordinates;
  distance: number;
};

export class CoordinatesGenerator {
  // Radius of the Earth in kilometers
  private readonly EARTH_RADIUS_KM = 6371;

  private currCoords: Coordinates;
  private nextCoords: Coordinates;

  constructor(coords: Coordinates) {
    this.currCoords = {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };

    this.nextCoords = {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  }

  getGeoInfo(): GeoInfo {
    return {
      coords: this.currCoords,
      distance: this.calculateDistance(),
    };
  }

  // Haversine formula to calculate distance between two coordinates
  calculateDistance() {
    const lat1 = this.currCoords.latitude * (Math.PI / 180);
    const lat2 = this.nextCoords.latitude * (Math.PI / 180);
    const deltaLat =
      (this.nextCoords.latitude - this.currCoords.latitude) * (Math.PI / 180);
    const deltaLon =
      (this.nextCoords.longitude - this.currCoords.longitude) * (Math.PI / 180);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.EARTH_RADIUS_KM * c; // Distance in kilometers
  }

  // Function to generate random walking coordinates close to the previous point
  generateWalkingCoordinates(maxStep: number = 0.1) {
    const y0 = this.currCoords.latitude;
    const x0 = this.currCoords.longitude;

    // Max step in kilometers (50-150 meters), convert to degrees
    const stepInDegrees = maxStep / 111;

    // Generate small random values for step (representing small movement)
    const u = Math.random();
    const v = Math.random();
    const w = stepInDegrees * Math.sqrt(u); // Scale by step
    const t = 2 * Math.PI * v; // Random direction

    const xStep = w * Math.cos(t);
    const yStep = w * Math.sin(t);

    this.currCoords = this.nextCoords;
    this.nextCoords = {
      latitude: y0 + yStep, // Small latitude change
      longitude: x0 + xStep, // Small longitude change
    };
  }
}

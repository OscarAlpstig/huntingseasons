export function downwindDirection(windFromDirection: number) {
  return (windFromDirection + 180) % 360;
}

export function compassDirection(degrees: number) {
  const names = ['N', 'NÖ', 'Ö', 'SÖ', 'S', 'SV', 'V', 'NV'];
  return names[Math.round(((degrees % 360) + 360) % 360 / 45) % names.length];
}

export function destinationPoint(lat: number, lon: number, bearing: number, distanceMeters: number): [number, number] {
  const earthRadius = 6_371_000;
  const angularDistance = distanceMeters / earthRadius;
  const bearingRadians = bearing * Math.PI / 180;
  const latRadians = lat * Math.PI / 180;
  const lonRadians = lon * Math.PI / 180;
  const destinationLat = Math.asin(
    Math.sin(latRadians) * Math.cos(angularDistance) +
    Math.cos(latRadians) * Math.sin(angularDistance) * Math.cos(bearingRadians),
  );
  const destinationLon = lonRadians + Math.atan2(
    Math.sin(bearingRadians) * Math.sin(angularDistance) * Math.cos(latRadians),
    Math.cos(angularDistance) - Math.sin(latRadians) * Math.sin(destinationLat),
  );
  return [destinationLat * 180 / Math.PI, destinationLon * 180 / Math.PI];
}

export function weatherSymbol(symbolCode?: number, precipitationAmount = 0, frozenPart = 0) {
  if (symbolCode && [11, 19].includes(symbolCode)) return 'thunder';
  if (precipitationAmount >= 0.1) return frozenPart >= 0.5 ? 'snow' : 'rain';
  if (symbolCode === 7) return 'fog';
  if (symbolCode && [12, 13, 14, 15, 16, 17, 20, 21, 25, 26, 27].includes(symbolCode)) return 'snow';
  if (symbolCode && [8, 9, 10, 18, 22, 23, 24].includes(symbolCode)) return 'rain';
  if (symbolCode && [1, 2].includes(symbolCode)) return 'sun';
  if (symbolCode && [3, 4].includes(symbolCode)) return 'partly-cloudy';
  return 'cloud';
}

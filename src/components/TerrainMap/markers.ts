import L from 'leaflet';

export function createSelectedMarker(position: L.LatLngExpression, onMove: (lat: number, lon: number) => void) {
  const marker = L.marker(position, {
    icon: L.divIcon({
      className: 'selected-location-marker', html: '<span aria-hidden="true"></span>',
      iconSize: [24, 24], iconAnchor: [12, 12],
    }),
    draggable: true, title: 'Vald jaktplats – dra för att flytta', keyboard: true,
  });
  marker.on('dragend', () => {
    const { lat, lng } = marker.getLatLng();
    onMove(lat, lng);
  });
  return marker;
}

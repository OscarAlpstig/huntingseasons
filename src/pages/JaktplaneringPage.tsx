import WeatherMapPanel from '../components/WeatherMapPanel/WeatherMapPanel';
import { findNearestLan } from '../data/lan';

interface Props {
  lat: number;
  lon: number;
  setLat: (lat: number) => void;
  setLon: (lon: number) => void;
  setSelectedLan: (lan: string) => void;
}

const JaktplaneringPage = ({ lat, lon, setLat, setLon, setSelectedLan }: Props) => {
  const updateLocation = (latitude: number, longitude: number) => {
    setLat(latitude);
    setLon(longitude);
    setSelectedLan(findNearestLan(latitude, longitude));
  };

  return (
    <div className="planning-page">
      <section className="planning-hero">
        <span className="eyebrow">PLANERA JAKTEN</span>
        <h1>Vind &amp; vittring</h1>
        <p>Välj jaktplats och tid för att se hur vinden kan föra din vittring.</p>
      </section>
      <WeatherMapPanel lat={lat} lon={lon} onLocationChange={updateLocation} />
    </div>
  );
};

export default JaktplaneringPage;

import { getAnimalIconKind } from './animalIconKind';

const asset = (name: string) => `${import.meta.env.BASE_URL}icons/${name}.png`;

export const AnimalIcon = ({ species }: { species: string }) => (
  <img src={asset(`animal-${getAnimalIconKind(species)}`)} alt={`${species}, silhuett`} width="192" height="192" />
);

export const BrandMark = () => (
  <img src={asset('brand-antlers')} alt="" width="256" height="256" />
);

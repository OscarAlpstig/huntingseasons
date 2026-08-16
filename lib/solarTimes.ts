import {getDateAtTimeInZone} from './utils';
// @ts-expect-error The legacy module has no type declarations.
import {GetTimes, GetTimeZone} from './Suncalc/suncalc.js';

export interface SolarTimes {
    dawn: Date;
    sunrise: Date;
    solarNoon: Date;
    sunset: Date;
    dusk: Date;
}

export function calculateSolarTimes(date: Date, lat: number, lon: number) {
    const timeZone = GetTimeZone(lat, lon) as string;
    const calculationDate = getDateAtTimeInZone(date, timeZone);
    const times = GetTimes(calculationDate, lat, lon) as SolarTimes;

    return {calculationDate, timeZone, times};
}

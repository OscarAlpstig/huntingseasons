import React, { useEffect } from 'react';
import Moon from './components/Moon';
// @ts-expect-error The legacy SunCalc module has no type declarations.
import { GetMoonIllumination, GetMoonTimes, GetTimes, GetTimeZone } from "../lib/Suncalc/suncalc";
import { getDateAtTimeInZone, GetTimeOfDay } from "../lib/utils.ts";

interface SoltiderProps {
    date: Date;
    lat: number;
    lon: number;
}

interface MoonData {
    fraction: number,
    angle: number,
}


interface SunTimes {
    sunrise: Date,
    sunset: Date,
    dusk: Date
    dawn: Date
}

interface MoonTimes {
    alwaysUp: boolean,
    alwaysDown: boolean,
    rise: Date,
    set: Date,
}

const Soltider: React.FC<SoltiderProps> = ({ date, lat, lon }) => {
    const timeZone = GetTimeZone(lat, lon);
    const [times, setTimes] = React.useState<Partial<SunTimes>>({});
    const [moonTimes, setMoonTimes] = React.useState<Partial<MoonTimes>>({});
    const [moonData, setMoonData] = React.useState<Partial<MoonData>>({});

    useEffect(() => {
        const calculationDate = getDateAtTimeInZone(date, timeZone);
        const sunTimes = GetTimes(calculationDate, lat, lon);
        setTimes({
            sunrise: sunTimes.sunrise,
            sunset: sunTimes.sunset,
            dawn: sunTimes.dawn,
            dusk: sunTimes.dusk,
        });

        const localMidnight = getDateAtTimeInZone(date, timeZone, 0);
        const calculatedMoonTimes = GetMoonTimes(localMidnight, lat, lon);
        setMoonTimes(calculatedMoonTimes);

        const moonPos = GetMoonIllumination(calculationDate);
        setMoonData({
            angle: moonPos.angle,
            fraction: moonPos.fraction ?? 0,
        });
    }, [date, lat, lon, timeZone])

    return (
        <div style={{ marginTop: '2rem' }}>
            <h3>Soltider</h3>
            <div style={{ marginBottom: '1.5rem' }}>
                <strong>Borgerlig gryning:</strong> {GetTimeOfDay(times.dawn, timeZone)}<br />
                <strong>Solupgång:</strong> {GetTimeOfDay(times.sunrise, timeZone)}<br />
                <strong>Solnedgång:</strong> {GetTimeOfDay(times.sunset, timeZone)}<br />
                <strong>Borgerlig skymning:</strong> {GetTimeOfDay(times.dusk, timeZone)}<br />
            </div>
            <div>
                <h4>Månen</h4>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div>
                        <div style={{ height: '100px' }}>
                            <Moon angle={moonData.angle} phasePercentage={Math.round((moonData.fraction != undefined ? moonData.fraction : 0) * 100) / 100} />
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                            <strong>{Math.round((moonData.fraction != undefined ? moonData.fraction : 0) * 100)}% belyst</strong>
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <strong>Månuppgång:</strong> {moonTimes.alwaysUp ? 'Alltid uppe' : `${GetTimeOfDay(moonTimes.rise, timeZone)}`}<br />
                        <strong>Månnedgång:</strong> {moonTimes.alwaysDown ? 'Alltid nere' : `${GetTimeOfDay(moonTimes.set, timeZone)}`}<br />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Soltider;

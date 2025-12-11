import React, { useEffect } from 'react';
import Moon from './components/Moon';
// @ts-ignore
import { GetMoonIllumination, GetMoonTimes, GetTimes } from "../lib/Suncalc/suncalc";
import { GetTimeOfDay } from "../lib/utils.ts";

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
    const [times, setTimes] = React.useState<Partial<SunTimes>>({});
    const [moonTimes, setMoonTimes] = React.useState<Partial<MoonTimes>>({});
    const [moonData, setMoonData] = React.useState<Partial<MoonData>>({});

    useEffect(() => {
        getSunTimes();
        getMoonTimes();
        getMoonData();
    }, [date, lat, lon])


    const getSunTimes = () => {
        let times = GetTimes(date, lat, lon);
        let newTimesObject = {
            // @ts-ignore
            sunrise: times.sunrise as DateTime,
            // @ts-ignore
            sunset: times.sunset as DateTime,
            // @ts-ignore
            dawn: times.dawn as DateTime,
            // @ts-ignore
            dusk: times.dusk as DateTime
        } as SunTimes;

        setTimes(newTimesObject);
    }

    const getMoonTimes = () => {
        let times = GetMoonTimes(date, lat, lon);

        let newMoonPos = {
            rise: times.rise as Date,
            set: times.set as Date,
            // @ts-ignore
            alwaysDown: times.alwaysDown,
            // @ts-ignore
            alwaysUp: times.alwaysUp,
        } as MoonTimes;
        setMoonTimes(newMoonPos);
    }

    const getMoonData = () => {
        let moonPos = GetMoonIllumination(date);
        let fraction = moonPos.fraction != undefined ? moonPos.fraction : 0;
        let newMoonPos = {
            angle: moonPos.angle,
            fraction: fraction
        } as MoonData

        setMoonData(newMoonPos);
        return moonPos;
    }

    return (
        <div style={{ marginTop: '2rem' }}>
            <h3>Soltider</h3>
            <div style={{ marginBottom: '1.5rem' }}>
                <strong>Borgerlig gryning:</strong> {GetTimeOfDay(times.dawn)}<br />
                <strong>Solupgång:</strong> {GetTimeOfDay(times.sunrise)}<br />
                <strong>Solnedgång:</strong> {GetTimeOfDay(times.sunset)}<br />
                <strong>Borgerlig skymning:</strong> {GetTimeOfDay(times.dusk)}<br />
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
                        <strong>Månuppgång:</strong> {moonTimes.alwaysUp ? 'Alltid uppe' : `${GetTimeOfDay(moonTimes.rise)}`}<br />
                        <strong>Månnedgång:</strong> {moonTimes.alwaysDown ? 'Alltid nere' : `${GetTimeOfDay(moonTimes.set)}`}<br />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Soltider;

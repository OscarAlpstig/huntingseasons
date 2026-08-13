import {afterEach, describe, expect, it} from "vitest";
import {DateTime} from "luxon";
// @ts-expect-error The legacy SunCalc module has no type declarations.
import {GetTimes, GetTimeZone} from "./Suncalc/suncalc.js";
import {getDateAtTimeInZone, GetTimeOfDay, SWEDISH_TIME_ZONE} from "./utils";

const STOCKHOLM = {lat: 59.3293, lon: 18.0686};
const originalTimeZone = process.env.TZ;

afterEach(() => {
    process.env.TZ = originalTimeZone;
});

function calculate(calendarDate: [number, number, number], clientTimeZone: string) {
    process.env.TZ = clientTimeZone;
    const selectedDate = new Date(calendarDate[0], calendarDate[1] - 1, calendarDate[2]);
    const originalValue = selectedDate.valueOf();
    const timeZone = GetTimeZone(STOCKHOLM.lat, STOCKHOLM.lon);
    const calculationDate = getDateAtTimeInZone(selectedDate, timeZone);
    const times = GetTimes(calculationDate, STOCKHOLM.lat, STOCKHOLM.lon);

    return {
        originalValue,
        selectedDate,
        calculationDate,
        timeZone,
        sunrise: GetTimeOfDay(times.sunrise, timeZone),
        sunset: GetTimeOfDay(times.sunset, timeZone),
        dawn: GetTimeOfDay(times.dawn, timeZone),
        dusk: GetTimeOfDay(times.dusk, timeZone),
        rawSunrise: times.sunrise,
    };
}

describe("Stockholm sun times", () => {
    it.each([
        [[2025, 1, 15], "08:31", "15:24"],
        [[2025, 8, 15], "05:06", "20:40"],
    ] as const)("uses CET/CEST automatically for %j", (calendarDate, sunrise, sunset) => {
        const result = calculate([...calendarDate], "UTC");

        expect(result.timeZone).toBe(SWEDISH_TIME_ZONE);
        expect(result.sunrise).toBe(sunrise);
        expect(result.sunset).toBe(sunset);
        expect(result.rawSunrise).toBeInstanceOf(Date);
        expect(DateTime.fromJSDate(result.rawSunrise, {zone: result.timeZone}).offset)
            .toBe(calendarDate[1] === 1 ? 60 : 120);
    });

    it.each([
        [2025, 3, 29],
        [2025, 3, 30],
        [2025, 3, 31],
        [2025, 10, 25],
        [2025, 10, 26],
        [2025, 10, 27],
    ] as const)("keeps the selected date around DST transition %j", (...calendarDate) => {
        const result = calculate(calendarDate, "America/Los_Angeles");
        const expectedDate = calendarDate.map(value => String(value).padStart(2, "0")).join("-");

        expect(DateTime.fromJSDate(result.calculationDate, {zone: result.timeZone}).toISODate())
            .toBe(expectedDate);
        expect(result.calculationDate.valueOf()).not.toBe(result.originalValue);
        expect(result.selectedDate.valueOf()).toBe(result.originalValue);
    });

    it.each([
        [2025, 1, 15],
        [2025, 8, 15],
        [2025, 3, 30],
        [2025, 10, 26],
    ] as const)("is independent of the client time zone for %j", (...calendarDate) => {
        const utc = calculate(calendarDate, "UTC");
        const losAngeles = calculate(calendarDate, "America/Los_Angeles");
        const tokyo = calculate(calendarDate, "Asia/Tokyo");
        const displayedTimes = ({sunrise, sunset, dawn, dusk}: typeof utc) => ({sunrise, sunset, dawn, dusk});

        expect(displayedTimes(losAngeles)).toEqual(displayedTimes(utc));
        expect(displayedTimes(tokyo)).toEqual(displayedTimes(utc));
    });
});

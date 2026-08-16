import {afterEach, describe, expect, it} from "vitest";
import {DateTime} from "luxon";
// @ts-expect-error The legacy SunCalc module has no type declarations.
import {calculateSolarTimes} from "./solarTimes";
import {GetTimeOfDay, SWEDISH_TIME_ZONE} from "./utils";

const STOCKHOLM = {lat: 59.3293, lon: 18.0686};
const KATRINEHOLM = {lat: 58.9959442, lon: 16.2058242};
const originalTimeZone = process.env.TZ;

afterEach(() => {
    process.env.TZ = originalTimeZone;
});

function calculate(
    calendarDate: [number, number, number],
    clientTimeZone: string,
    location = STOCKHOLM,
) {
    process.env.TZ = clientTimeZone;
    const selectedDate = new Date(calendarDate[0], calendarDate[1] - 1, calendarDate[2]);
    const originalValue = selectedDate.valueOf();
    const {calculationDate, timeZone, times} = calculateSolarTimes(selectedDate, location.lat, location.lon);

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
        rawSunset: times.sunset,
    };
}

describe("Stockholm sun times", () => {
    it.each([
        [[2025, 1, 15], "08:30", "15:24"],
        [[2025, 8, 15], "05:05", "20:37"],
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

describe("Katrineholm sun times", () => {
    // Reference: https://www.vackertvader.se/katrineholm/soluppg%C3%A5ng-och-solnedg%C3%A5ng/2026/8
    it.each([
        [[2026, 8, 1], {dawn: "03:44", sunrise: "04:41", sunset: "21:20", dusk: "22:16"}],
        [[2026, 8, 16], {dawn: "04:26", sunrise: "05:15", sunset: "20:42", dusk: "21:31"}],
        [[2026, 8, 31], {dawn: "05:05", sunrise: "05:49", sunset: "20:00", dusk: "20:44"}],
    ] as const)("stays within two minutes of published times for %j", (calendarDate, published) => {
        const result = calculate([...calendarDate], "UTC", KATRINEHOLM);
        const asMinutes = (value: string) => {
            const [hours, minutes] = value.split(":").map(Number);
            return hours * 60 + minutes;
        };

        for (const phase of ["dawn", "sunrise", "sunset", "dusk"] as const) {
            expect(Math.abs(asMinutes(result[phase]) - asMinutes(published[phase])))
                .toBeLessThanOrEqual(2);
        }
    });

    it("keeps both solar events on the selected local date", () => {
        const result = calculate([2026, 8, 16], "UTC", KATRINEHOLM);

        expect(DateTime.fromJSDate(result.rawSunrise, {zone: result.timeZone}).toISODate())
            .toBe("2026-08-16");
        expect(DateTime.fromJSDate(result.rawSunset, {zone: result.timeZone}).toISODate())
            .toBe("2026-08-16");
    });
});

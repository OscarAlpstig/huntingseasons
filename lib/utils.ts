import {DateTime} from "luxon";

export const SWEDISH_TIME_ZONE = "Europe/Stockholm";

type DateInput = Date | DateTime | string;

export const formatDate = (date: DateInput) => {
    date = getAsDateTime(date);
    return GetAsLocalTime(date).toISODate()
}

export const formatDateWithMonthsAsText = (date: DateInput) => {
    date = getAsDateTime(date);

    return GetAsLocalTime(date).toFormat('dd MMMM', {locale: "SV"})
}

export const GetTimeOfDay = (date: DateInput | undefined, timeZone = SWEDISH_TIME_ZONE) => {
    if (date === undefined) return "-";
    const localtime = GetAsLocalTime(date, timeZone);
    if(localtime.isValid)
        return localtime.toFormat("HH':'mm", {locale: "SV"})
    return "-"
}

export const GetAsLocalTime = (date: DateInput, timeZone = SWEDISH_TIME_ZONE) => {
    date = getAsDateTime(date);

    return date.setZone(timeZone).setLocale("SV");
}

export const getDateAtTimeInZone = (
    date: Date,
    timeZone = SWEDISH_TIME_ZONE,
    hour = 12,
) => DateTime.fromObject(
    {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour,
    },
    {zone: timeZone},
).toJSDate();

export const getAsDateTime = (date: DateInput) => {
    if (!DateTime.isDateTime(date)) {
        if (date instanceof Date)
            return DateTime.fromJSDate(date);
        else
            return DateTime.fromISO(date);
    }
    return date;
}

export const getAsDate = (today: DateTime, shortDate: string) => {
    let currentYear = today.year;
    if (parseInt(shortDate.slice(0, 2)) <= 6 && today.month > 6) {
        currentYear += 1;
    }

    const dateIsoFormat = `${currentYear}-${shortDate.slice(0, 2)}-${shortDate.slice(2, 4)}`
    return DateTime.fromISO(dateIsoFormat);
}

export const isWithinRange = (now: DateTime, shortDateStart: string, shortDateEnd: string) => {
    const currentYear = now.year;
    const startMonth = parseInt(shortDateStart.slice(0, 2));
    const endMonth = parseInt(shortDateEnd.slice(0, 2));
    const startDate = DateTime.fromISO(`${currentYear}-${shortDateStart.slice(0, 2)}-${shortDateStart.slice(2, 4)}`)
    let stopDate = DateTime.fromISO(`${currentYear}-${shortDateEnd.slice(0, 2)}-${shortDateEnd.slice(2, 4)}`)
    if(endMonth < startMonth){
        stopDate = stopDate.plus({years:1});
    }
    
    return startDate <= now && now <= stopDate;
}

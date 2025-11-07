import {DateTime} from "luxon";

export const formatDate = (date: any) => {
    date = getAsDateTime(date);
    return GetAsLocalTime(date).toISODate()
}

export const formatDateWithMonthsAsText = (date: any) => {
    date = getAsDateTime(date);

    return GetAsLocalTime(date).toFormat('dd MMMM', {locale: "SV"})
}

export const GetTimeOfDay = (date: any) => {
    let localtime = GetAsLocalTime(date);
    if(localtime.isValid)
        return localtime.toFormat("HH':'mm", {locale: "SV"})
    return "-"
}

export const GetAsLocalTime = (date: any) => {
    date = getAsDateTime(date);

    return date.setLocale("SV");
}

export const getAsDateTime = (date: any) => {
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

    let dateIsoFormat = `${currentYear}-${shortDate.slice(0, 2)}-${shortDate.slice(2, 4)}`
    return DateTime.fromISO(dateIsoFormat);
}

export const isWithinRange = (now: DateTime, shortDateStart: string, shortDateEnd: string) => {
    let currentYear = now.year;
    let startMonth = parseInt(shortDateStart.slice(0, 2));
    let endMonth = parseInt(shortDateEnd.slice(0, 2));
    let startDate = DateTime.fromISO(`${currentYear}-${shortDateStart.slice(0, 2)}-${shortDateStart.slice(2, 4)}`)
    let stopDate = DateTime.fromISO(`${currentYear}-${shortDateEnd.slice(0, 2)}-${shortDateEnd.slice(2, 4)}`)
    if(endMonth < startMonth){
        stopDate = stopDate.plus({years:1});
    }
    
    return startDate <= now && now <= stopDate;
}



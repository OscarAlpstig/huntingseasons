export function getSeasonDate(month: number, day: number, nextYear: boolean = false): Date {
  const now = new Date();
  const year = nextYear ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(year, month, day);
}


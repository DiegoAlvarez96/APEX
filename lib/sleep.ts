export function calculateSleepDuration(sleepTime: string, wakeTime: string) {
  const [sleepHour, sleepMinute] = sleepTime.split(":").map(Number);
  const [wakeHour, wakeMinute] = wakeTime.split(":").map(Number);
  const sleepTotal = sleepHour * 60 + sleepMinute;
  let wakeTotal = wakeHour * 60 + wakeMinute;
  if (wakeTotal <= sleepTotal) wakeTotal += 24 * 60;
  return wakeTotal - sleepTotal;
}

export function formatSleepDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} h ${rest.toString().padStart(2, "0")} min`;
}

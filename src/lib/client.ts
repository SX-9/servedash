import { writable } from 'svelte/store';

export const notifs = writable('');
export const errors = writable('');

export function readableUptime(seconds: number) {
  let days: number = Math.floor(seconds / 86400);
  seconds %= 86400;
  let hours: number = Math.floor(seconds / 3600);
  seconds %= 3600;
  let minutes: number = Math.floor(seconds / 60);
  seconds %= 60;

  let hoursStr: string = String(hours).padStart(2, '0');
  let minutesStr: string = String(minutes).padStart(2, '0');
  let secondsStr: string = String(Math.round(seconds)).padStart(2, '0');
  let daysStr: string = days?(' '+days+' day'+(days>1?'s':'')):'';

  return `${hoursStr}:${minutesStr}:${secondsStr} up${daysStr}`;
}
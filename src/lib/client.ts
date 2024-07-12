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

export function readableByteSize(bytes: number, decimals: number = 2) {
  if (bytes === 0) return '0B';

  const k: number = 1024;
  const dm: number = decimals < 0 ? 0 : decimals;
  const sizes: string[] = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i: number = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}

export function convertPermissions(mask: number) {
  const perms = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
  return mask
      .toString()
      .split('')
      .map(digit => perms[parseInt(digit)])
      .join('');
}

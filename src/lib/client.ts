import { writable } from 'svelte/store';
import type { LinkItem } from './types';

export const notifs = writable('');
export const errors = writable('');

export const keymap: {[key: string]: {value: string, pos: number}} = {
  '<': {value: '<>', pos: 1},
  '(': {value: '()', pos: 1},
  '{': {value: '{}', pos: 1},
  '[': {value: '[]', pos: 1},
  '\'': {value: '\'\'', pos: 1},
  '"': {value: '""', pos: 1},
  '`': {value: '``', pos: 1},
};

export function toUrl({ URLlink }: LinkItem, localhost: boolean = false) {
  return (URLlink.prot || 'http') + '://' + (URLlink.host || (localhost ? '127.0.0.1' : window?.location?.hostname)) + (URLlink.port ? ':' + URLlink.port : '') + URLlink.path;
}

export function initTextarea(editing: HTMLTextAreaElement) {
  editing.addEventListener('keydown', event => {
      const pos = editing.selectionStart;
      const value = editing.value;
      const key = event.key;
  
      if (keymap[key]) {
        event.preventDefault();
        editing.value = value.slice(0, pos - 1) 
          + keymap[key].value 
          + value.slice(pos);
  
        editing.selectionStart = editing.selectionEnd = pos + keymap[key].pos;
      } else if (key === 'Tab') {
        event.preventDefault();
        editing.value = value.slice(0, pos) + 
          '  ' + value.slice(pos);
        
        editing.selectionStart = editing.selectionEnd = pos + 2;
      }
    });
}

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

export function readableNumber(i: number) {
  return Intl.NumberFormat('en', { notation: 'compact' }).format(i);
}

export function convertPermissions(mask: number) {
  const perms = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
  return mask
      .toString()
      .split('')
      .map(digit => perms[parseInt(digit)])
      .join('');
}

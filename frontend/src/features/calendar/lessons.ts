import { getISODay } from 'date-fns';
import { json, request } from '../../app/api';
import { asDate } from './dates';

export interface LessonFields {
  weekday: number;
  subject: string;
  room: string;
  startTime: string;
  endTime: string;
  termStart: string;
  termEnd: string;
}

export interface Lesson extends LessonFields {
  id: string;
}

export const weekdays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export function lessonsOn(items: Lesson[], day: string) {
  const weekday = getISODay(asDate(day));
  return items.filter(item => item.weekday === weekday && item.termStart <= day && day <= item.termEnd);
}

const plural = new Intl.PluralRules('ru');

export function lessonCount(count: number) {
  const form = plural.select(count);
  return count + ' ' + (form === 'one' ? 'пара' : form === 'few' ? 'пары' : 'пар');
}

export const lessonApi = {
  list(from: string, to: string, signal: AbortSignal) {
    return request<{ items: Lesson[] }>('/lessons?' + new URLSearchParams({ from, to }), { signal });
  },
  create(id: string, fields: LessonFields) {
    return request<Lesson>('/lessons', json('POST', { id, ...fields }));
  },
  edit(id: string, fields: LessonFields) {
    return request<Lesson>('/lessons/' + encodeURIComponent(id), json('PUT', fields));
  },
  remove(id: string) {
    return request<void>('/lessons/' + encodeURIComponent(id), { method: 'DELETE' });
  },
};

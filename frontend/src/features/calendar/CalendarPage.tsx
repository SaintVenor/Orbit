import { ActionIcon, Alert, Button, NativeSelect, Switch } from '@mantine/core';
import { addMonths, format, getISODay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, type Area, type CalendarItem, type EntryFields, type Kind } from '../../app/api';
import { Header } from '../../app/Header';
import { useDialog } from '../../app/useDialog';
import { useLoad } from '../../app/useLoad';
import { useMutation } from '../../app/useMutation';
import { planApi } from '../plans/planApi';
import { Agenda } from './Agenda';
import { EntryDialog } from './EntryDialog';
import { MonthGrid } from './MonthGrid';
import { LessonDialog } from './LessonDialog';
import { lessonApi, lessonsOn, type Lesson } from './lessons';
import { StepPicker } from './StepPicker';
import { asDate, birthdayInViewYear, dateKey, isDateKey, kindLabels, monthDays, monthKey, monthSummary, moveDay } from './dates';
import styles from './calendar.module.css';

interface LoadedCalendar {
  range: string;
  items: CalendarItem[];
}

function useCalendar(from: string, to: string) {
  const range = from + '/' + to;
  const [revision, refresh] = useReducer(value => value + 1, 0);
  const requestKey = range + '/' + revision;
  const [data, setData] = useState<LoadedCalendar>();
  const [completed, setCompleted] = useState<{ key: string; failed: boolean }>();

  useEffect(() => {
    const controller = new AbortController();
    api.calendar(from, to, controller.signal).then(response => {
      if (controller.signal.aborted) return;
      setData({ range, items: response.items });
      setCompleted({ key: requestKey, failed: false });
    }).catch(() => {
      if (!controller.signal.aborted) setCompleted({ key: requestKey, failed: true });
    });
    return () => controller.abort();
  }, [from, to, range, requestKey]);

  return {
    items: data?.range === range ? data.items : [],
    loading: completed?.key !== requestKey,
    failed: completed?.key === requestKey && completed.failed,
    refresh,
  };
}

export function CalendarPage() {
  const [query, setQuery] = useSearchParams();
  const today = dateKey(new Date());
  const requestedDate = query.get('date');
  const requestedMonth = query.get('month');
  const monthDate = requestedMonth ? requestedMonth + '-01' : null;
  const selected = isDateKey(requestedDate) ? requestedDate : today;
  const defaultMonth = asDate(selected);
  const candidate = isDateKey(monthDate) ? monthDays(asDate(monthDate)) : null;
  const month = candidate?.days.includes(selected) && monthDate ? asDate(monthDate) : defaultMonth;
  const range = monthDays(month);
  const monthId = monthKey(month);
  const { items, loading, failed, refresh } = useCalendar(range.from, range.to);
  const [area, setArea] = useState<Area | ''>('');
  const [kind, setKind] = useState<Kind | ''>('');
  const [dialog, setDialog] = useState<{ item?: CalendarItem } | null>(null);
  const [notice, setNotice] = useState('');
  const dialogTrigger = useRef<HTMLElement | null>(null);
  const picker = useDialog<true>();
  const [showLessons, setShowLessons] = useState(false);
  const lessonDialog = useDialog<Lesson | 'new'>();
  const { from, to } = range;
  const loadLessons = useCallback((signal: AbortSignal) => lessonApi.list(from, to, signal), [from, to]);
  const { data: lessonData, loading: lessonsLoading, failed: lessonsFailed, refresh: refreshLessons } = useLoad(loadLessons, showLessons);
  const lessons = lessonData?.items ?? [];
  const dayLessons = lessonsOn(lessons, selected);
  const lessonCounts = new Map(range.days.map(day => [day, lessonsOn(lessons, day).length]));
  const stepAction = useMutation();
  const filtered = Boolean(area || kind);
  const visible = items.filter(item => (!area || item.area === area) && (!kind || item.kind === kind));
  const summary = monthSummary(visible, range.first, range.last);

  function go(day: string, view = day.slice(0, 7)) {
    const next = new URLSearchParams({ date: day });
    if (!day.startsWith(view)) next.set('month', view);
    setQuery(next);
    setNotice('');
    stepAction.clearError();
  }

  function select(day: string) {
    go(day, range.days.includes(day) ? monthId : undefined);
  }

  function openAgenda(day: string) {
    select(day);
    document.getElementById('agenda-date')?.focus();
  }

  function shift(offset: number) {
    go(monthKey(addMonths(month, offset)) + '-01');
  }

  function clearFilters() {
    setArea('');
    setKind('');
  }

  function closeDialog() {
    const trigger = dialogTrigger.current;
    setDialog(null);
    requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus();
      else document.getElementById('agenda-date')?.focus();
    });
  }

  function saved(record: EntryFields) {
    closeDialog();
    if (record.kind === 'birthday' && record.birthMonth && record.birthDay) {
      select(birthdayInViewYear(selected, record.birthMonth, record.birthDay));
    } else if (record.startDate && record.endDate && (selected < record.startDate || selected > record.endDate)) {
      select(record.startDate);
    }
    if ((area && area !== record.area) || (kind && kind !== record.kind)) clearFilters();
    setNotice('Запись сохранена.');
    refresh();
  }

  function open(item?: CalendarItem) {
    dialogTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDialog({ item });
  }

  function assigned(stepArea: Area) {
    picker.close();
    if ((area && area !== stepArea) || (kind && kind !== 'step')) clearFilters();
    setNotice('Шаг назначен.');
    refresh();
  }

  function complete(item: CalendarItem) {
    void stepAction.submit(() => planApi.editStep(item.id, { done: true }), () => {
      setNotice('Шаг выполнен.');
      refresh();
      requestAnimationFrame(() => document.getElementById('agenda-date')?.focus());
    });
  }

  function savedLesson(lesson: Lesson) {
    lessonDialog.close();
    if (!lessonsOn([lesson], selected).length) {
      const start = lesson.termStart > range.first ? lesson.termStart : range.first;
      const next = moveDay(start, (lesson.weekday - getISODay(asDate(start)) + 7) % 7);
      const first = moveDay(lesson.termStart, (lesson.weekday - getISODay(asDate(lesson.termStart)) + 7) % 7);
      select(next <= lesson.termEnd ? next : first);
    }
    setNotice('Пара сохранена.');
    refreshLessons();
  }

  const add = () => open();
  const calendarHref = '/calendar' + (query.size ? '?' + query.toString() : '');

  return <>
    <Header onAdd={add} />
    <main className="shell content">
      <div className={styles.heading}>
        <div>
          <h1>{format(month, 'LLLL', { locale: ru })} <span>{format(month, 'yyyy')}</span></h1>
          <p className={styles.summary} aria-live="polite">{summary || (loading
            ? 'Загрузка записей…' : failed ? '' : filtered ? 'Нет записей по выбранным фильтрам.' : 'В этом месяце пока нет записей.')}</p>
        </div>
        <div className={styles.controls}>
          <ActionIcon variant="default" size="lg" aria-label="Предыдущий месяц" onClick={() => shift(-1)}>‹</ActionIcon>
          <ActionIcon variant="default" size="lg" aria-label="Следующий месяц" onClick={() => shift(1)}>›</ActionIcon>
          <Button variant="default" onClick={() => go(today)}>Сегодня</Button>
        </div>
      </div>
      <div className={styles.filters}>
        <NativeSelect aria-label="Сфера" value={area}
          data={[{ value: '', label: 'Все сферы' }, { value: 'study', label: 'Учёба' }, { value: 'personal', label: 'Личное' }]}
          onChange={event => setArea(event.currentTarget.value as Area | '')} />
        <NativeSelect aria-label="Тип" value={kind}
          data={[{ value: '', label: 'Все типы' }, ...Object.entries(kindLabels).map(([value, label]) => ({ value, label }))]}
          onChange={event => setKind(event.currentTarget.value as Kind | '')} />
        {filtered && <Button variant="subtle" onClick={clearFilters}>Сбросить фильтры</Button>}
        <div className={styles.scheduleControls}>
          <Switch label="Учебные пары" checked={showLessons} onChange={event => setShowLessons(event.currentTarget.checked)} />
          {showLessons && <Button variant="default" size="compact-md" onClick={() => lessonDialog.open('new')}>Добавить пару</Button>}
        </div>
      </div>
      {lessonsFailed && <Alert color="red" role="alert" className={styles.alert}>
        Не удалось загрузить учебное расписание. <Button variant="subtle" size="compact-sm" onClick={refreshLessons}>Повторить</Button>
      </Alert>}
      {notice && <Alert role="status" className={styles.alert}>{notice}</Alert>}
      {stepAction.error && <Alert color="red" role="alert" className={styles.alert}>{stepAction.error.message}</Alert>}
      {failed && <Alert color="red" role="alert" className={styles.alert}>
        Не удалось загрузить календарь. <Button variant="subtle" size="compact-sm" onClick={refresh}>Повторить</Button>
      </Alert>}
      <div className={styles.layout}>
        <MonthGrid days={range.days} month={monthId} today={today} selected={selected}
          items={visible} lessonCounts={lessonCounts} onSelect={select} onAgenda={openAgenda} onOpen={open} />
        <Agenda day={selected} items={visible} loading={loading && !items.length} failed={failed} filtered={filtered}
          calendarHref={calendarHref} onAdd={add} onOpen={open} onPick={() => picker.open(true)}
          onComplete={complete} stepPending={stepAction.busy}
          lessons={dayLessons} lessonsLoading={lessonsLoading} onLessonOpen={lesson => lessonDialog.open(lesson)} />
      </div>
    </main>
    {lessonDialog.value && <LessonDialog day={selected} lesson={lessonDialog.value === 'new' ? undefined : lessonDialog.value}
      onClose={lessonDialog.close} onSaved={savedLesson} onRemoved={() => {
        lessonDialog.close();
        setNotice('Пара удалена.');
        refreshLessons();
        requestAnimationFrame(() => document.getElementById('agenda-date')?.focus());
      }} />}
    {picker.value && <StepPicker day={selected} calendarHref={calendarHref} onClose={picker.close} onAssigned={assigned} />}
    {dialog && <EntryDialog day={selected} item={dialog.item} onClose={closeDialog}
      onSaved={saved} onDeleted={() => {
        dialogTrigger.current = document.getElementById('agenda-date');
        closeDialog();
        setNotice('Запись удалена.');
        refresh();
      }} />}
  </>;
}

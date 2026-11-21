import { Button, Card, Skeleton, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';
import type { CalendarItem } from '../../app/api';
import { dayTime, fullDate, intersects, itemKey, kindLabels, kindMarks, longDate, scheduleLabel } from './dates';
import type { Lesson } from './lessons';
import styles from './calendar.module.css';

interface Props {
  day: string;
  items: CalendarItem[];
  loading: boolean;
  failed: boolean;
  filtered: boolean;
  calendarHref: string;
  onAdd: () => void;
  onOpen: (item: CalendarItem) => void;
  onPick: () => void;
  onComplete: (item: CalendarItem) => void;
  stepPending: boolean;
  lessons: Lesson[];
  lessonsLoading: boolean;
  onLessonOpen: (lesson: Lesson) => void;
}

export function Agenda({
  day, items, loading, failed, filtered, calendarHref, onAdd, onOpen, onPick, onComplete, stepPending,
  lessons, lessonsLoading, onLessonOpen,
}: Props) {
  const dayItems = items.filter(item => intersects(item, day)).sort((left, right) =>
    dayTime(left, day).localeCompare(dayTime(right, day)) || left.title.localeCompare(right.title, 'ru'),
  );

  return <Card component="aside" withBorder radius="lg" className={styles.agenda} aria-label="Повестка">
    <h2 id="agenda-date" tabIndex={-1} aria-label={fullDate(day)}>{longDate(day)}</h2>
    <p className={styles.agendaLabel}>Повестка дня</p>
    {loading && <Stack gap="xs" aria-label="Загрузка записей" role="status">
      <Skeleton height={24} width="65%" /><Skeleton height={75} />
    </Stack>}
    {!loading && !dayItems.length && !failed && (!lessons.length || filtered) && <p>{filtered
      ? 'Нет записей по выбранным фильтрам.'
      : 'На этот день ничего не запланировано.'}</p>}
    {dayItems.map(item => <article className={styles.agendaEntry + ' kind-' + item.kind} key={itemKey(item)}>
      <div className={styles.entryKind}><span aria-hidden="true">{item.done ? '✓' : kindMarks[item.kind]}</span> {kindLabels[item.kind]}{item.done && ' · Выполнен'}</div>
      <h3>{item.title}</h3>
      {scheduleLabel(item, day) && <div className={styles.schedule}>{scheduleLabel(item, day)}</div>}
      {item.kind === 'step'
        ? <div className={styles.stepActions}>
          <Link to={'/plans/' + encodeURIComponent(item.planId ?? '')} state={{ calendarHref }}>{item.planTitle}</Link>
          {!item.done && <Button variant="default" size="compact-sm" disabled={stepPending}
            onClick={() => onComplete(item)}>Отметить выполненным</Button>}
        </div>
        : <Button variant="default" size="compact-sm" mt={8} onClick={() => onOpen(item)}>Открыть запись</Button>}
    </article>)}
    {lessonsLoading && <Skeleton height={44} role="status" aria-label="Загрузка учебных пар" />}
    {lessons.length > 0 && <section className={styles.lessons} aria-labelledby="lesson-heading">
      <h3 id="lesson-heading">Учебные пары</h3>
      {lessons.map(lesson => <article className={styles.lessonEntry} key={lesson.id}>
        <h4>{lesson.subject}</h4>
        <div className={styles.schedule}>{lesson.startTime}–{lesson.endTime} · Аудитория {lesson.room}</div>
        <Button variant="default" size="compact-sm" mt={8} onClick={() => onLessonOpen(lesson)}
          aria-label={'Редактировать пару «' + lesson.subject + '»'}>Редактировать пару</Button>
      </article>)}
    </section>}
    <div className={styles.agendaActions}>
      <Button variant="default" onClick={onAdd}>Добавить запись</Button>
      <Button variant="light" onClick={onPick}>Выбрать шаг из планов</Button>
    </div>
  </Card>;
}

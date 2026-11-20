import { Alert, Button, Card, Checkbox, Skeleton } from '@mantine/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Header } from '../../app/Header';
import { useDialog } from '../../app/useDialog';
import { useLoad } from '../../app/useLoad';
import { useMutation } from '../../app/useMutation';
import { fullDate } from '../calendar/dates';
import { PlanEditor } from './PlanEditor';
import { Cover } from './PlansPage';
import { planApi, type PlanDetail, type Resource, type Step } from './planApi';
import styles from './plans.module.css';

type Editor = { kind: 'plan' } | { kind: 'step'; step?: Step } | { kind: 'resource' };

function PlanContent({ initial }: { initial: PlanDetail }) {
  const [plan, setPlan] = useState(initial);
  const [query, setQuery] = useSearchParams();
  const addFirstStep = query.get('add') === 'step';
  const dialog = useDialog<Editor>();
  const { open } = dialog;
  const addStepButton = useRef<HTMLButtonElement>(null);
  const { busy, error, submit } = useMutation();

  useEffect(() => {
    if (addFirstStep) open({ kind: 'step' }, addStepButton.current);
  }, [addFirstStep, open]);

  function close() {
    dialog.close();
    if (addFirstStep) setQuery({}, { replace: true });
  }

  function updateStep(step: Step) {
    setPlan(previous => ({
      ...previous,
      steps: [...previous.steps.filter(item => item.id !== step.id), step].sort((left, right) => left.position - right.position),
    }));
  }

  function saveResource(resource: Resource) {
    setPlan(previous => ({
      ...previous,
      resources: previous.resources.some(item => item.id === resource.id)
        ? previous.resources.map(item => item.id === resource.id ? resource : item)
        : [...previous.resources, resource],
    }));
    close();
  }

  const editing = dialog.value;
  const count = plan.steps.filter(step => step.done).length;

  return <>
    <Card component="article" withBorder radius="lg" className={styles.detail}>
      <Cover motif={plan.motif} />
      <div className={styles.heading}>
        <h1>{plan.title}</h1>
        <Button variant="default" disabled={busy} onClick={() => dialog.open({ kind: 'plan' })}>Редактировать план</Button>
      </div>
      {plan.note && <p className={styles.note}>{plan.note}</p>}
      <div className={styles.progress}>
        <label htmlFor="plan-progress">{count} из {plan.steps.length}</label>
        <progress id="plan-progress" value={count} max={plan.steps.length || 1} />
      </div>

      {error && <Alert color="red" role="alert">{error.message}</Alert>}
      <section className={styles.section} aria-labelledby="steps-heading">
        <div className={styles.sectionHeading}>
          <h2 id="steps-heading">Шаги</h2>
          <Button ref={addStepButton} variant="light" disabled={busy} onClick={() => open({ kind: 'step' })}>
            {plan.steps.length ? 'Добавить шаг' : 'Добавить первый шаг'}
          </Button>
        </div>
        {plan.steps.length > 0 && <ol className={styles.list}>
          {plan.steps.map(step => <li className={styles.row} key={step.id}>
            <div>
              <Checkbox label={step.title} checked={step.done} disabled={busy}
                onChange={event => {
                  const done = event.currentTarget.checked;
                  void submit(() => planApi.editStep(step.id, { done }), updateStep);
                }} />
              {step.scheduledDate && <Link className={styles.stepDate} to={'/calendar?date=' + step.scheduledDate}>
                {fullDate(step.scheduledDate)}
              </Link>}
            </div>
            <Button size="compact-sm" variant="default" disabled={busy} onClick={() => dialog.open({ kind: 'step', step })}
              aria-label={'Редактировать шаг «' + step.title + '»'}>Редактировать</Button>
          </li>)}
        </ol>}
      </section>

      <section className={styles.section} aria-labelledby="materials-heading">
        <div className={styles.sectionHeading}>
          <h2 id="materials-heading">Материалы</h2>
          <Button variant="light" disabled={busy} onClick={() => dialog.open({ kind: 'resource' })}>Добавить материал</Button>
        </div>
        {plan.resources.length === 0 && <p className={styles.next}>Материалов пока нет.</p>}
        {plan.resources.length > 0 && <ul className={styles.list}>
          {plan.resources.map(resource => <li className={styles.row} key={resource.id}>
            <a href={resource.url} target="_blank" rel="noreferrer">{resource.title}</a>
            <Button color="red" variant="subtle" size="compact-sm" disabled={busy}
              aria-label={'Удалить материал «' + resource.title + '»'}
              onClick={() => void submit(() => planApi.removeResource(resource.id), () =>
                setPlan(previous => ({ ...previous, resources: previous.resources.filter(item => item.id !== resource.id) })),
              )}>Удалить</Button>
          </li>)}
        </ul>}
      </section>
    </Card>
    {editing?.kind === 'plan' && <PlanEditor mode={{ kind: 'plan', plan, saved: saved => { setPlan(saved); close(); } }} onClose={close} />}
    {editing?.kind === 'step' && <PlanEditor mode={{ kind: 'step', planId: plan.id, step: editing.step,
      saved: step => { updateStep(step); close(); } }} onClose={close} />}
    {editing?.kind === 'resource' && <PlanEditor mode={{ kind: 'resource', planId: plan.id, saved: saveResource }} onClose={close} />}
  </>;
}

export function PlanDetailPage() {
  const { id = '' } = useParams();
  const { state } = useLocation();
  const load = useCallback((signal: AbortSignal) => planApi.detail(id, signal), [id]);
  const { data, loading, failed, refresh } = useLoad(load);

  return <>
    <Header />
    <main className="shell content">
      <Link className={styles.back} to="/plans" state={state}>Все планы</Link>
      {loading && <Skeleton height={300} role="status" aria-label="Загрузка плана" />}
      {failed && <Alert color="red" role="alert">
        Не удалось открыть план. <Button variant="subtle" size="compact-sm" onClick={refresh}>Повторить</Button>
      </Alert>}
      {data && <PlanContent key={id} initial={data} />}
    </main>
  </>;
}

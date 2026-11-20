import { Alert, Button, Card, Skeleton } from '@mantine/core';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../../app/Header';
import { useDialog } from '../../app/useDialog';
import { useLoad } from '../../app/useLoad';
import { PlanEditor } from './PlanEditor';
import { planApi, type Motif } from './planApi';
import styles from './plans.module.css';

export function Cover({ motif }: { motif: Motif }) {
  return <div className={styles.cover} data-motif={motif} aria-hidden="true" />;
}

export function PlansPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dialog = useDialog<true>();
  const { data, loading, failed, refresh } = useLoad(planApi.list);

  return <>
    <Header />
    <main className="shell content">
      <div className={styles.heading}>
        <h1>Планы</h1>
        <Button onClick={() => dialog.open(true)}>＋ Новый план</Button>
      </div>
      {loading && <Skeleton height={220} role="status" aria-label="Загрузка планов" />}
      {failed && <Alert color="red" role="alert">
        Не удалось загрузить планы. <Button variant="subtle" size="compact-sm" onClick={refresh}>Повторить</Button>
      </Alert>}
      {data?.items.length === 0 && <p>Планов пока нет.</p>}
      <div className={styles.gallery}>
        {data?.items.map(plan => {
          const href = '/plans/' + encodeURIComponent(plan.id);
          const done = plan.steps.filter(step => step.done).length;
          const next = plan.steps.find(step => !step.done);
          return <Card className={styles.card} key={plan.id} withBorder padding="lg" radius="lg">
            <Cover motif={plan.motif} />
            <h2><Link to={href} state={location.state}>{plan.title}</Link></h2>
            <p className={styles.counter}>{done} из {plan.steps.length}</p>
            <p className={styles.next}>{plan.steps.length === 0
              ? <Link to={href + '?add=step'} state={location.state}>Добавить первый шаг</Link>
              : next?.title ?? 'Все шаги выполнены'}</p>
          </Card>;
        })}
      </div>
    </main>
    {dialog.value && <PlanEditor mode={{ kind: 'plan', saved: plan => {
      dialog.close();
      navigate('/plans/' + encodeURIComponent(plan.id), { state: location.state });
    } }} onClose={dialog.close} />}
  </>;
}

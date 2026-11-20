import argparse
from datetime import date, timedelta

from .db import connect, initialize


def seed(anchor):
    initialize()
    prefix = f"demo-{anchor:%Y-%m}"
    # Keep the demo trip crossing the month boundary for every seed month.
    next_month = (anchor.replace(day=28) + timedelta(days=4)).replace(day=1)
    trip_start = next_month - timedelta(days=4)
    trip_end = next_month + timedelta(days=1)
    with connect() as db:
        db.executemany(
            """INSERT OR IGNORE INTO entries
               (id, kind, title, area, startDate, endDate, startTime, birthMonth, birthDay)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [
                (f"{prefix}-lab", "deadline", "Лабораторная по алгоритмам", "study",
                 anchor.isoformat(), anchor.isoformat(), "18:00", None, None),
                (f"{prefix}-travel", "event", "Поездка в Карелию", "personal",
                 trip_start.isoformat(), trip_end.isoformat(), None, None, None),
                ("demo-birthday", "birthday", "День рождения Саши", "personal",
                 None, None, None, anchor.month, 24),
            ],
        )
        db.execute(
            """INSERT OR IGNORE INTO plans (id, title, area, note, motif)
               VALUES (?, ?, ?, ?, ?)""",
            ("demo-film", "Снять первый короткий ролик", "personal",
             "Собрать ролик из коротких кадров и попробовать монтаж.", "film"),
        )
        db.executemany(
            """INSERT OR IGNORE INTO steps (id, plan_id, position, title, done)
               VALUES (?, 'demo-film', ?, ?, ?)""",
            [
                ("demo-watch", 1, "Посмотреть урок", 1),
                ("demo-draft", 2, "Собрать черновик", 0),
                ("demo-review", 3, "Посмотреть ролик целиком", 0),
            ],
        )
        db.execute(
            """INSERT OR IGNORE INTO resources (id, plan_id, title, url)
               VALUES ('demo-tutorial', 'demo-film', 'Урок по монтажу',
                       'https://www.blender.org/support/tutorials/')""",
        )
    print(f"Demo seed: {anchor.isoformat()}, trip {trip_start} .. {trip_end}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", type=date.fromisoformat, default=date.today())
    seed(parser.parse_args().date)

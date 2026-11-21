from datetime import date, datetime, timedelta

from .db import connect, initialize

ENGLISH = "Английский язык B1.1"
SPEAKING = "Техники публичных выступлений и презентаций"
MATH = "Дополнительные главы высшей математики"
AI = "Технологии ИИ в разработке ПО"
OOP = "Объектно-ориентированное проектирование"
HISTORY = "История России и мира в XX веке"
SPORT = "Большой зал (4405)"
PROBABILITY = "Теория вероятности"

# Only the dates shown in the source. The grid has 90-minute teaching slots.
LESSONS = {
    16: [("11:30", "Волейбол", SPORT), ("13:30", "Базы данных", "2324")],
    17: [("08:10", ENGLISH, "3210"), ("09:50", ENGLISH, "3210"),
         ("13:30", PROBABILITY, "Orange Classroom (1229)"), ("17:10", PROBABILITY, "2127")],
    18: [("08:10", SPEAKING, "2304"), ("09:50", SPEAKING, "2304"), ("11:30", MATH, "2127")],
    19: [("09:50", AI, "2342"), ("11:30", "Базы данных", "2342")],
    20: [("09:50", AI, "2334"), ("13:30", "Волейбол", SPORT)],
    21: [("09:50", OOP, "2412"), ("11:30", OOP, "2412"), ("13:30", OOP, "2403")],
    23: [("09:50", "Волейбол", SPORT), ("13:30", "Базы данных", "2324")],
    24: [("08:10", ENGLISH, "3210"), ("09:50", ENGLISH, "3210"),
         ("13:30", PROBABILITY, "Orange Classroom (1229)"), ("17:10", PROBABILITY, "2127")],
    25: [("09:50", MATH, "2304"), ("11:30", MATH, "2127")],
    26: [("11:30", "Базы данных", "2342"), ("13:30", HISTORY, "2407 (архив)"), ("15:30", HISTORY, "2337")],
    27: [("13:30", "Волейбол", SPORT)],
    28: [("13:30", OOP, "2403")],
}


def import_schedule():
    initialize()
    with connect() as db:
        rows = []
        for number, entries in LESSONS.items():
            day = date(2026, 11, number)
            for clock, subject, room in entries:
                finish = (datetime.strptime(clock, "%H:%M") + timedelta(minutes=90)).strftime("%H:%M")
                identifier = f"itmo-{day:%Y%m%d}-{clock.replace(':', '')}"
                rows.append((identifier, day.isoweekday(), subject, room, clock, finish, day.isoformat(), day.isoformat()))
        inserted = db.executemany(
            """INSERT OR IGNORE INTO lessons
               (id, weekday, subject, room, startTime, endTime, termStart, termEnd)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""", rows,
        ).rowcount
    print(f"Imported {inserted} of {len(rows)} class sessions.")


if __name__ == "__main__":
    import_schedule()

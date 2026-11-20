CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('deadline', 'event', 'birthday')),
    title TEXT NOT NULL,
    area TEXT NOT NULL CHECK (area IN ('study', 'personal')),
    startDate TEXT,
    endDate TEXT,
    startTime TEXT,
    endTime TEXT,
    birthMonth INTEGER,
    birthDay INTEGER
);

CREATE INDEX IF NOT EXISTS entry_dates ON entries (startDate, endDate);

CREATE TABLE IF NOT EXISTS entry_operations (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    area TEXT NOT NULL CHECK (area IN ('study', 'personal')),
    note TEXT NOT NULL DEFAULT '',
    motif TEXT NOT NULL CHECK (motif IN ('route', 'film', 'grid'))
);

CREATE TABLE IF NOT EXISTS steps (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    title TEXT NOT NULL,
    scheduled_date TEXT,
    done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
    UNIQUE (plan_id, position)
);

CREATE INDEX IF NOT EXISTS step_dates ON steps (scheduled_date);

CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL
);

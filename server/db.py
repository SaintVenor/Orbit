import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parent


@contextmanager
def connect():
    path = Path(os.environ.get("ORBIT_DB", ROOT.parent / ".data" / "orbit.sqlite3"))
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    try:
        with db:
            yield db
    finally:
        db.close()


def initialize():
    with connect() as db:
        db.executescript((ROOT / "schema.sql").read_text(encoding="utf-8"))

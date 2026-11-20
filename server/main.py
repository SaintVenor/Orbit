import json
from contextlib import asynccontextmanager
from datetime import date

from fastapi import FastAPI, HTTPException, Query, Response
from pydantic import ValidationError

from .db import connect, initialize
from .entries import CreateEntry, EntryFields, calendar_date, invalid, normalize


@asynccontextmanager
async def lifespan(app):
    initialize()
    yield


app = FastAPI(title="Орбита", lifespan=lifespan)


@app.get("/api/health")
def health():
    return {"ok": True}


def by_id(db, entry_id):
    item = db.execute("SELECT * FROM entries WHERE id = ?", (entry_id,)).fetchone()
    if item is None:
        raise HTTPException(404, "Запись не найдена.")
    return dict(item)


def calendar_item(row, occurrence=None):
    return {
        "id": row["id"],
        "kind": row["kind"],
        "title": row["title"],
        "area": row["area"],
        "startDate": occurrence or row["startDate"],
        "endDate": occurrence or row["endDate"],
        "startTime": row["startTime"],
        "endTime": row["endTime"],
    }


@app.get("/api/calendar")
def calendar(start_raw: str = Query(alias="from"), end_raw: str = Query(alias="to")):
    start = calendar_date(start_raw, "from", "query")
    end = calendar_date(end_raw, "to", "query")
    if end < start:
        invalid("to", "Окончание раньше начала.", "query")

    with connect() as db:
        entries = db.execute(
            """SELECT * FROM entries WHERE kind != 'birthday'
               AND startDate <= ? AND endDate >= ?""", (end_raw, start_raw),
        ).fetchall()
        birthdays = db.execute("SELECT * FROM entries WHERE kind = 'birthday'").fetchall()
        steps = db.execute(
            """SELECT s.id, s.title, p.area, s.scheduled_date, s.done,
                      p.id AS plan_id, p.title AS plan_title
               FROM steps s JOIN plans p ON p.id = s.plan_id
               WHERE s.scheduled_date BETWEEN ? AND ?""", (start_raw, end_raw),
        ).fetchall()

    items = [calendar_item(row) for row in entries]
    for row in birthdays:
        for year in range(start.year, end.year + 1):
            try:
                occurrence = date(year, row["birthMonth"], row["birthDay"])
            except ValueError:
                continue
            if start <= occurrence <= end:
                items.append(calendar_item(row, occurrence.isoformat()))

    items.extend({
        "id": row["id"], "kind": "step", "title": row["title"], "area": row["area"],
        "startDate": row["scheduled_date"], "endDate": row["scheduled_date"],
        "planId": row["plan_id"], "planTitle": row["plan_title"], "done": bool(row["done"]),
    } for row in steps)
    items.sort(key=lambda item: (item["startDate"], item["title"], item["kind"], item["id"]))
    return {"items": items}


@app.post("/api/entries", status_code=201)
def create_entry(fields: CreateEntry):
    data = normalize(fields)
    payload = json.dumps(data, sort_keys=True)
    with connect() as db:
        db.execute("BEGIN IMMEDIATE")
        operation = db.execute(
            "SELECT payload FROM entry_operations WHERE id = ?", (fields.id,),
        ).fetchone()
        if operation:
            if operation["payload"] != payload:
                raise HTTPException(409, "Этот идентификатор уже использован для другой записи.")
            return by_id(db, fields.id)
        if db.execute("SELECT 1 FROM entries WHERE id = ?", (fields.id,)).fetchone():
            raise HTTPException(409, "Запись с таким идентификатором уже существует.")
        db.execute(
            """INSERT INTO entries
               (id, kind, title, area, startDate, endDate, startTime, endTime, birthMonth, birthDay)
               VALUES (:id, :kind, :title, :area, :startDate, :endDate, :startTime,
                       :endTime, :birthMonth, :birthDay)""", data,
        )
        db.execute("INSERT INTO entry_operations (id, payload) VALUES (?, ?)", (fields.id, payload))
        return by_id(db, fields.id)


@app.patch("/api/entries/{entry_id}")
def update_entry(entry_id: str, changes: dict):
    with connect() as db:
        db.execute("BEGIN IMMEDIATE")
        current = by_id(db, entry_id)
        current.pop("id")
        try:
            fields = EntryFields.model_validate({**current, **changes})
        except ValidationError as error:
            details = [
                {"loc": ["body", *item["loc"]], "msg": item["msg"]}
                for item in error.errors()
            ]
            raise HTTPException(422, detail=details) from error
        db.execute(
            """UPDATE entries SET kind=:kind, title=:title, area=:area, startDate=:startDate,
               endDate=:endDate, startTime=:startTime, endTime=:endTime,
               birthMonth=:birthMonth, birthDay=:birthDay WHERE id=:id""",
            {**normalize(fields), "id": entry_id},
        )
        return by_id(db, entry_id)


@app.delete("/api/entries/{entry_id}", status_code=204)
def delete_entry(entry_id: str):
    with connect() as db:
        deleted = db.execute("DELETE FROM entries WHERE id = ?", (entry_id,))
        if deleted.rowcount == 0:
            raise HTTPException(404, "Запись не найдена.")
    return Response(status_code=204)

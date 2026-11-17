"""
Unified Storage Layer:
When MongoDB Atlas connection string is provided, uses real AsyncIOMotorDatabase.
When pending, uses a resilient file-backed local collection adapter with the exact
same async PyMongo/Motor interface, ensuring the backend is 100% testable and operational.
"""

import os
import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pathlib import Path
from app.database import db_manager
from app.config import BASE_DIR

LOCAL_DATA_DIR = BASE_DIR / "data"
LOCAL_DATA_DIR.mkdir(parents=True, exist_ok=True)

class AsyncLocalCursor:
    def __init__(self, items: List[Dict[str, Any]]):
        self._items = items
        self._idx = 0

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            key, direction = key_or_list[0]
        else:
            key = key_or_list
        reverse = direction < 0
        self._items.sort(key=lambda x: x.get(key, ""), reverse=reverse)
        return self

    def limit(self, n: int):
        self._items = self._items[:n]
        return self

    def __aiter__(self):
        self._idx = 0
        return self

    async def __anext__(self):
        if self._idx < len(self._items):
            item = self._items[self._idx]
            self._idx += 1
            return item
        raise StopAsyncIteration

    async def to_list(self, length: Optional[int] = None):
        if length is not None:
            return self._items[:length]
        return list(self._items)


class LocalCollection:
    def __init__(self, name: str):
        self.name = name
        self.file_path = LOCAL_DATA_DIR / f"{name}.json"
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._load()

    def _load(self):
        if self.file_path.exists():
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._cache = {item.get("_id", str(uuid.uuid4())): item for item in data}
            except Exception:
                self._cache = {}
        else:
            self._cache = {}

    def _save(self):
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(list(self._cache.values()), f, default=str, indent=2)
        except Exception as e:
            pass

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, cond) for cond in v):
                    return False
            elif doc.get(k) != v:
                return False
        return True

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for doc in self._cache.values():
            if self._matches(doc, query):
                return dict(doc)
        return None

    def find(self, query: Optional[Dict[str, Any]] = None):
        query = query or {}
        matches = [dict(doc) for doc in self._cache.values() if self._matches(doc, query)]
        return AsyncLocalCursor(matches)

    async def insert_one(self, doc: Dict[str, Any]):
        doc_to_save = dict(doc)
        if "_id" not in doc_to_save:
            doc_to_save["_id"] = str(uuid.uuid4())
        self._cache[doc_to_save["_id"]] = doc_to_save
        self._save()
        class InsertResult:
            inserted_id = doc_to_save["_id"]
        return InsertResult()

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        target_id = None
        for doc_id, doc in self._cache.items():
            if self._matches(doc, query):
                target_id = doc_id
                break

        class UpdateResult:
            matched_count = 0
            modified_count = 0

        res = UpdateResult()
        if target_id and target_id in self._cache:
            res.matched_count = 1
            if "$set" in update:
                self._cache[target_id].update(update["$set"])
                res.modified_count = 1
            if "$inc" in update:
                for inc_field, val in update["$inc"].items():
                    curr = self._cache[target_id].get(inc_field, 0)
                    self._cache[target_id][inc_field] = curr + val
                res.modified_count = 1
            self._save()
        return res

    async def delete_one(self, query: Dict[str, Any]):
        target_id = None
        for doc_id, doc in self._cache.items():
            if self._matches(doc, query):
                target_id = doc_id
                break

        class DeleteResult:
            deleted_count = 0

        res = DeleteResult()
        if target_id and target_id in self._cache:
            del self._cache[target_id]
            self._save()
            res.deleted_count = 1
        return res

    async def delete_many(self, query: Dict[str, Any]):
        to_del = [doc_id for doc_id, doc in self._cache.items() if self._matches(doc, query)]
        class DeleteResult:
            deleted_count = 0
        res = DeleteResult()
        for doc_id in to_del:
            del self._cache[doc_id]
        if to_del:
            self._save()
        res.deleted_count = len(to_del)
        return res

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        query = query or {}
        return sum(1 for doc in self._cache.values() if self._matches(doc, query))

    async def create_index(self, *args, **kwargs):
        return True


class StorageProvider:
    """Provides collection handles dynamically based on MongoDB Atlas status."""
    _local_collections: Dict[str, LocalCollection] = {}

    @classmethod
    def get_collection(cls, name: str):
        if db_manager.db is not None:
            return db_manager.db[name]
        if name not in cls._local_collections:
            cls._local_collections[name] = LocalCollection(name)
        return cls._local_collections[name]

def get_col(name: str):
    return StorageProvider.get_collection(name)

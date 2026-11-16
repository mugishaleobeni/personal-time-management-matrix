import logging
import asyncio
from typing import Optional, Any, Dict, List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

logger = logging.getLogger("chronos.database")

class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    is_connected: bool = False
    connection_status: str = "uninitialized"

    async def connect(self):
        """
        Connects to MongoDB Atlas if MONGODB_URI is provided.
        If MONGODB_URI is not yet provided, gracefully sets status to pending
        without attempting network connections to arbitrary/invented hosts.
        """
        if not settings.has_mongodb_uri:
            self.is_connected = False
            self.connection_status = "pending_mongodb_uri"
            logger.info("MongoDB URI not provided yet. Ready to connect as soon as MONGODB_URI is set.")
            return

        try:
            logger.info("Connecting to MongoDB Atlas...")
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            self.db = self.client[settings.DATABASE_NAME]
            # Ping database to verify connection
            await self.client.admin.command('ping')
            self.is_connected = True
            self.connection_status = "connected"
            logger.info(f"Successfully connected to MongoDB Atlas database: '{settings.DATABASE_NAME}'")
            
            # Setup indexes
            await self.setup_indexes()
        except Exception as e:
            self.is_connected = False
            self.connection_status = f"connection_failed: {str(e)}"
            logger.error(f"MongoDB connection failed: {e}")

    async def setup_indexes(self):
        """Creates appropriate collections and indexes in MongoDB Atlas"""
        if not self.is_connected or self.db is None:
            return
        try:
            # Users collection: unique email
            await self.db.users.create_index("email", unique=True)
            
            # Tasks collection: index by userId, status, dueDate
            await self.db.tasks.create_index([("userId", 1), ("status", 1)])
            await self.db.tasks.create_index([("userId", 1), ("dueDate", 1)])
            
            # Routines collection: index by userId and period
            await self.db.routines.create_index([("userId", 1), ("period", 1)])
            
            # Notes collection: index by userId, pinned, and updatedAt
            await self.db.notes.create_index([("userId", 1), ("pinned", -1)])
            await self.db.notes.create_index([("userId", 1), ("category", 1)])
            
            # Timer logs / sessions: index by userId and timestamp
            await self.db.timer_sessions.create_index([("userId", 1), ("timestamp", -1)])
            
            logger.info("MongoDB Atlas indexes verified and initialized.")
        except Exception as e:
            logger.warning(f"Could not initialize indexes: {e}")

    async def close(self):
        if self.client:
            self.client.close()
            self.is_connected = False
            self.connection_status = "closed"
            logger.info("MongoDB Atlas connection closed.")

db_manager = DatabaseManager()

def get_database():
    """Returns the active MongoDB database handle or None if not connected"""
    return db_manager.db

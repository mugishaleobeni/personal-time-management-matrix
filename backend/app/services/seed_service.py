import uuid
from typing import Dict, Any, List
from datetime import datetime
from app.repository import get_col

BOB_MARLEY_PORTRAIT = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=85"

INITIAL_TASKS: List[Dict[str, Any]] = []
INITIAL_ROUTINES: List[Dict[str, Any]] = []
INITIAL_NOTES: List[Dict[str, Any]] = []

async def seed_user_defaults(user_id: str):
    """
    Demo data seeding has been disabled per user request.
    Users start with a clean workspace with no mock/demo records.
    """
    pass

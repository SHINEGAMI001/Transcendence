"""
apps.py — Django AppConfig for the game application.

Key rule: AppConfig.ready() is called synchronously during Django startup,
before any event loop is running. You CANNOT call asyncio.run() or
loop.create_task() here safely — it will either deadlock or create a loop
that fights with Daphne's own loop.

Correct pattern: do NOT start any async task here.
The game loop is started lazily inside GameConsumer.connect() when the
first player joins a room.  This means:

  ✓ Zero overhead when no games are active
  ✓ No duplicate loops (guard flag on RoomState.running)
  ✓ No startup races with Daphne/uvicorn
  ✓ Natural cleanup when the room empties (consumer.disconnect)
"""

from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class GameConfig(AppConfig):
    name            = "game"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self) -> None:
        """
        Called once when Django loads. Safe to import signals here.
        Do NOT start async tasks — no event loop exists yet.
        """
        logger.info("[GameConfig] Game app loaded. Loops start on first connection.")

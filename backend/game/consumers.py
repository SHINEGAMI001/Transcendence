"""
consumers.py — Network layer only.
Direct-send broadcast (bypasses channel layer for speed).
"""

import json, logging, asyncio, time
from channels.generic.websocket import AsyncWebsocketConsumer
from .state import get_or_create_room, get_room, delete_room
from .engine import apply_input, tick

logger = logging.getLogger(__name__)
TICK_RATE = 60
TICK_INTERVAL = 1.0 / TICK_RATE


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.player_id = self.channel_name
        await self.accept()

        room = await get_or_create_room(self.room_id)
        room.add_player(self.player_id)
        room.register_consumer(self.player_id, self)

        player = room.players.get(self.player_id)
        await self.send(text_data=json.dumps({
            "type": "init",
            "player_id": self.player_id,
            "team": player.team if player else "left",
            "arena": {"width": 800, "height": 500},
        }))

        # FIX: Check if task is None OR if it is done (crashed/exited)
        if room.loop_task is None or room.loop_task.done():
            room.running = True
            room.last_tick_time = time.monotonic()
            room.loop_task = asyncio.create_task(
                _game_loop(room), name=f"game_loop_{self.room_id}")
            logger.info("[%s] Game loop started", self.room_id)
        else:
            # If the loop is alive but paused, wake it up
            room.running = True

        logger.info("[%s] Player joined: %s (%d players)",
                    self.room_id, self.player_id[:12], room.player_count())

    async def disconnect(self, close_code):
        room = get_room(self.room_id)
        if room is None:
            return
        room.remove_player(self.player_id)
        room.unregister_consumer(self.player_id)
        logger.info("[%s] Player left: %s (%d remain)",
                    self.room_id, self.player_id[:12], room.player_count())

        if room.is_empty():
            room.running = False
            if room.loop_task:
                room.loop_task.cancel()
                try:
                    await room.loop_task
                except asyncio.CancelledError:
                    pass
                room.loop_task = None
            await delete_room(self.room_id)
            logger.info("[%s] Room destroyed", self.room_id)

    async def receive(self, text_data=""):
        try:
            msg = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            return
        if not isinstance(msg, dict):
            return

        msg_type = msg.get("type")

        # ── Ping / pong ───────────────────────────────────────────────────────
        if msg_type == "ping":
            await self.send(text_data=json.dumps({"type": "pong"}))
            return

        # ── Live Chat ─────────────────────────────────────────────────────────
        if msg_type == "chat":
            text = str(msg.get("text", "")).strip()
            if not text:
                return
                
            # Limit message length to prevent spam/UI breaking
            text = text[:100] 
            
            room = get_room(self.room_id)
            if room:
                payload = json.dumps({
                    "type": "chat", 
                    "sender": self.player_id, 
                    "text": text
                })
                # Broadcast the message to everyone in the room instantly
                for consumer in room._consumers.values():
                    asyncio.create_task(consumer.send(text_data=payload))
            return

        # ── Player input ──────────────────────────────────────────────────────
        if msg_type != "input":
            return
        raw = msg.get("data")
        if not isinstance(raw, dict):
            return
        room = get_room(self.room_id)
        if room is None:
            return
        player = room.players.get(self.player_id)
        if player is None:
            return
        apply_input(player, raw)
        room.stats.record_message_in()

    async def game_state(self, event):
        await self.send(text_data=event["payload"])


async def _game_loop(room):
    room_id = room.room_id
    logger.info("[%s] Loop running (tick_rate=%d)", room_id, TICK_RATE)
    try:
        while True:
            if get_room(room_id) is None:
                break
            tick_start = time.monotonic()
            dt = tick_start - room.last_tick_time
            room.last_tick_time = tick_start

            if room.running:
                try:
                    tick(room, dt)
                except Exception:
                    logger.exception("[%s] tick() error", room_id)

            try:
                payload = json.dumps({"type": "state", "state": room.to_dict()})
                dead = []
                for pid, consumer in room._consumers.items():
                    try:
                        await consumer.send(text_data=payload)
                    except Exception:
                        dead.append(pid)
                for pid in dead:
                    room._consumers.pop(pid, None)
                    room.players.pop(pid, None)
                    logger.warning("[%s] Cleaned ghost: %s", room_id, pid[:12])
                room.stats.record_message_out()
            except Exception:
                logger.exception("[%s] broadcast error", room_id)

            tick_ms = (time.monotonic() - tick_start) * 1000.0
            room.stats.record_tick(tick_ms)
            if tick_ms > 16.0:
                logger.warning("[%s] SLOW TICK: %.2fms", room_id, tick_ms)

            if room.stats.should_report():
                r = room.stats.report()
                logger.info("[%s] STATS: players=%d avg=%.2fms max=%.2fms slow=%d hz=%.1f",
                            room_id, room.player_count(),
                            r["avg_ms"], r["max_ms"], r["slow"], r["actual_hz"])
                room.stats.reset()

            # FIX: Removed the logic that kills the loop when someone wins.
            # The engine.py tick() function will handle the restart delay automatically now.

            elapsed = time.monotonic() - tick_start
            sleep_for = TICK_INTERVAL - elapsed
            if sleep_for > 0:
                await asyncio.sleep(sleep_for)
            else:
                await asyncio.sleep(0)

    except asyncio.CancelledError:
        logger.info("[%s] Loop cancelled", room_id)
        raise
    except Exception:
        logger.exception("[%s] Loop crashed", room_id)
    finally:
        logger.info("[%s] Loop exited", room_id)

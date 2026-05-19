from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

        self.room = f"room_{self.scope['url_route']['kwargs']['conversation_id']}"

        # Add to group/room
        await self.channel_layer.group_add(
            self.room,
            self.channel_name
        )

        await self.send(text_data='{"message" : "u are connected to the channel"}')

    async def receive(self, text_data):
        text = json.loads(text_data)

        message = text['text']
        sender = self.scope['user'].username if self.scope['user'].is_authenticated else "Anonymous"
        
        await self.channel_layer.group_send(
            self.room,{
                "type" : "message",
                "text" : message,
                "sender": sender
            }
        )

    async def disconnect(self, closecode):
        await self.channel_layer.group_discard(
            self.room,
            self.channel_name
        )
        pass

    # Message event handler
    async def message(self, event):
        text = event['text']
        sender = event['sender']

        await self.send(text_data=json.dumps({
            "message" : text,
            "sender": sender
        }))

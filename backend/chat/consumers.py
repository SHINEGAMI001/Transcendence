from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from users.models import Conversation, Message
from django.utils import timezone
import json

# Saving sctive users in chat
ACTIVE_CHAT_CHANNELS = {
    #user_id : conversation_id
}

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        
        self.room = f"room_{self.scope['url_route']['kwargs']['conversation_id']}"
        self.user = self.scope['user']

        # Check authentication and validate user
        # Rejected when close()
        if not await self.if_belongs():
            await self.close()
            return
        # Track activity
        ACTIVE_CHAT_CHANNELS[self.user.id] = self.room 
        # Setup channel in room
        await self.channel_layer.group_add(
            self.room,
            self.channel_name
        )

        # Accept channel
        await self.accept()

    async def receive(self, text_data):
        
        text = json.loads(text_data)
        message = text['text']

        # Save to database
        await self.save_message(message=message)
        # Get receiver
        receiver = await self.get_receiver()

        # Broadcast event
        await self.channel_layer.group_send(
            self.room,{
                "type" : "message",
                "text" : message,
                "sender" : self.user.username
            }
        )

        # Send notification
        # Send when user not active in chat
        if ACTIVE_CHAT_CHANNELS.get(receiver.id) != self.room:
            await self.channel_layer.group_send(
                f"notification_{receiver.id}",{
                    "type" : "message_notify",
                    "info" : "new message",
                    "sender" : self.user.username,
                    "receiver" : receiver.username,
                    "created_at" : str(timezone.now())
                    
                    
                }
                
            )

    async def disconnect(self, closecode):
        
        # Remove from activity
        ACTIVE_CHAT_CHANNELS.pop(self.user.id, None)

        await self.channel_layer.group_discard(
            self.room,
            self.channel_name
        )


    # Message event handler
    async def message(self, event):
        text = event['text']
        sender = event['sender']

        await self.send(text_data=json.dumps({
            "message" : text,
            "sender" : sender
        }))
    
    # Authentication and user validation
    @database_sync_to_async
    def if_belongs(self):
        conv_id = self.scope['url_route']['kwargs']['conversation_id']
        
        conv_obj = Conversation.objects.filter(id=conv_id)
        if not conv_obj.exists():
            print("Conversation doesnt exist")
            return False
        conversation = conv_obj.first()
        if not conversation.participants.filter(username=self.user.username).exists():
            return False
        
        if not self.user.is_authenticated:
                print("user not valid", flush=True)
                return False
        
        return True
    

    # Save message to database function
    @database_sync_to_async
    def save_message(self, message):
        user = self.user
        conv_id = self.scope['url_route']['kwargs']['conversation_id']

        conversations = Conversation.objects.filter(id=conv_id)
        conv = conversations.first()

        # save message with sender
        Message.objects.create(
            conversation=conv,
            sender=user,
            message=message,
        )
    
    # Get the message receiver from the conversation
    @database_sync_to_async
    def get_receiver(self):
        conv_id = self.scope['url_route']['kwargs']['conversation_id']
        conversation = Conversation.objects.filter(id=conv_id)
        participants = conversation.first().participants.exclude(id=self.user.id)
        
        return participants.first()


# Notifications consumer
class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        self.room_id = f"notification_{self.user.id}"

        # Check if user authenticated
        if not self.user.is_authenticated:
            return await self.close()
        
        # Add to private room
        await self.channel_layer.group_add(
            self.room_id,
            self.channel_name
        )

        await self.accept()
        

    
    async def receive(self, text_data):
        pass


    # Disconnect user
    async def disconnect(self, closecode):

        await self.channel_layer.group_discard(
            self.room_id,
            self.channel_name
        )
    
    # Notification handler
    async def message_notify(self, event):
        

        await self.send(text_data=json.dumps({
            "info" : event['info'],
            "sender" : event['sender'],
            "receiver" : event['receiver'],
            "created_at" : event['created_at']

        }))



        



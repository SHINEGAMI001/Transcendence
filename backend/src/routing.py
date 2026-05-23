from django.urls import path
from chat.consumers import ChatConsumer, NotificationConsumer
from game.consumers import GameConsumer

websocket_urlpatterns = [
    path('ws/chat/<int:conversation_id>/', ChatConsumer.as_asgi()),
    path('ws/notifications/', NotificationConsumer.as_asgi()),
    path('ws/game/<str:room_id>/', GameConsumer.as_asgi()),
]


from django.urls import path, include
from . import views

urlpatterns = [
    path('conversation_id/<str:username>', views.conv_id),
    path('messages/<int:conv_id>', views.get_messages),
    path('conversations/', views.list_conversations),
    path('getunread/', views.get_unread),
    path('markasseen/', views.mark_as_seen)
]
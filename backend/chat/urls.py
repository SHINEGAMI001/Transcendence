from django.urls import path, include
from . import views

urlpatterns = [
    path('conversation_id/<str:username>', views.conv_id)
]
from django.urls import path
from .views import game_home

urlpatterns = [
    path('', game_home),
]

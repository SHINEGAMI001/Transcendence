from django.urls import path
from . import views

urlpatterns = [
    path('', views.game_home),
    path('create/', views.create_game),
    path('join/', views.add_player)
]

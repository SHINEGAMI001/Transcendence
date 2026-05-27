from django.urls import path
from . import views

urlpatterns = [
    path('', views.game_home),
    path('create/', views.create_game),
    path('join/', views.add_player),
    path('list/', views.list_games),
    path('invite/', views.send_invite),
    path('accept/', views.accept_invite),
    path('reject/', views.reject_invite),
    path('list_invites/', views.list_invites),
    path('create_queue/', views.create_queue),
    path('choose_team/', views.choose_team),
    path('leave_queue/', views.leave_queue),
    path('list_queue/<int:queue_id>/', views.list_queue),
    path('leave_game/', views.leave_game),
    path('end_game/', views.end_game),
    path('invite_status/<int:invite_id>/', views.invite_status)
]

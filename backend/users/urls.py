from django.urls import path
from . import views

urlpatterns = [
    path('', views.users),
    path('auth/register/', views.register),
    path('auth/login/', views.login_view),
    path('profile/me', views.profile),
    path('avatar/update', views.update_avatar),
    path('profile/update', views.update_profile),
    path('auth/logout', views.logout_view),
    path('profile/delete', views.delete_view),
    path('users/search/', views.advanced_search),
    path('users/profile/pub/<username>', views.pub_profile),
    path('users/friends/send_request', views.send_request),
    path('users/friends/friend_requests', views.friend_requests),
    path('users/friends/accept_request', views.accept_request),
    path('users/friends/reject_request', views.reject_request),
    path('users/friends/remove_friend', views.remove_friend),
    path('users/friends/list_friends', views.list_friends),
    path('users/friends/check_status/<username>', views.check_status)

]
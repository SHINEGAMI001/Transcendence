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
    path('users/profile/pub/<username>', views.pub_profile)
]
"""
URL configuration for src project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from . import settings
from django.conf.urls.static import static
from django.urls import path, include
from django.http import HttpResponse, JsonResponse
from django.contrib.staticfiles.urls import staticfiles_urlpatterns  # 1. ADD THIS IMPORT

def home(request):
    data = {
            "message" : "django app is up",
            "usage/" : {
                  "admin" : "localhost:8000/admin",
                  "register" : "localhost:8000/api/auth/register",
                  "login" : "localhost:8000/api/auth/login",
                  "profile" : "localhost:8000/api/profile/me"
                  }
            }
    return JsonResponse(data)

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/game/', include('game.urls'))
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

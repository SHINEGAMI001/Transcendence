from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, FriendRequest, Conversation, Message

# Register your models here.
admin.site.register(User)
admin.site.register(FriendRequest)
admin.site.register(Conversation)
admin.site.register(Message)

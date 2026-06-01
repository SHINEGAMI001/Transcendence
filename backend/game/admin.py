from django.contrib import admin
from .models import Game, Queue, GameInvites
# Register your models here.
admin.site.register(Game)
admin.site.register(Queue)
admin.site.register(GameInvites)

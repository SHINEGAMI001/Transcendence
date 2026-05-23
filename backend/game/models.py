from django.db import models
from src import settings
import uuid

# Create your models here.

# Game Model
class Game(models.Model):

    TYPE_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    team_a = models.ManyToManyField(settings.AUTH_USER_MODEL)
    team_b = models.ManyToManyField(settings.AUTH_USER_MODEL)
    team_a_count = models.IntegerField(default=0)
    team_b_count = models.IntegerField(default=0)

    winner_team = models.CharField(max_length=10, null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    max_players = models.IntegerField(default=6)

    


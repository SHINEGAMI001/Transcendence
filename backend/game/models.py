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
    team_a = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='games_team_a')
    team_b = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='games_team_b')
    team_a_count = models.IntegerField(default=0)
    team_b_count = models.IntegerField(default=0)

    winner_team = models.CharField(max_length=10, null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='games_created_by')
    created_at = models.DateTimeField(auto_now_add=True)
    max_players = models.IntegerField(default=6)


# Queue Model
class Queue(models.Model):
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('launched', 'Launched')
    ]

    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='participants')
    
    team_a = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='team_a_queue')
    team_b = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='team_b_queue')
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, default='waiting', choices=STATUS_CHOICES)

    def __str__(self):
        return f"Queue {self.id} - Owner {self.owner}"


# # Game invites Model
class GameInvites(models.Model):

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected')
    ]

    inviter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='inviter')
    invitee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='invitee')

    queue = models.ForeignKey(Queue, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"inviter : {self.inviter.username} -> invitee {self.invitee.username}"
    
    
    


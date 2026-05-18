from django.db import models
from django.contrib.auth.models import AbstractUser


# Extending the default user authentication model with AbstractUser
class User(AbstractUser):
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    avatar = models.ImageField(
        upload_to = 'avatars/',
        default = 'default/speed.gif'
    )

    friends = models.ManyToManyField('self', blank=True)
    last_seen = models.DateTimeField(auto_now=True)


# Friend requests relationship
class FriendRequest(models.Model):

    status_choices = [
        ('pending', 'Pending'),
        ('rejected', 'Rejected'),
        ('accepted', 'Accepted')
    ]

    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recieved_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=status_choices, default='pending')

    def __str__(self):
        return f"{self.from_user} -> {self.to_user}"


# Conversation beetween friends
class Conversation(models.Model):
    participants = models.ManyToManyField(User)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"conversation id: {self.id}"
        
# message sent information
class Message(models.Model):
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f" sender : {self.sender} -> conversation id : {self.conversation.id}"

    

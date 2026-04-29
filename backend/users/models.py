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


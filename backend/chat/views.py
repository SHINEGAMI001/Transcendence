from django.shortcuts import render

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from users.models import Conversation, Message


# Create your views here.
@api_view(['GET'])
def conv_id(request, username):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)
    
    user = request.user
    users = get_user_model()

    if user.username == username:
        return Response({"error message" : "cant start a conv with yourself"}, status=400)
    if not users.objects.filter(username=username).exists():
        return Response({"error message" : "no user found"}, status=404)

    second_user = users.objects.get(username=username)

    conversations = Conversation.objects.filter(participants=user).filter(participants=second_user)
    if conversations.exists():
        conversation = conversations.first()
    else:
        conversation = Conversation.objects.create()
        conversation.participants.add(user, second_user)
        
    data = {
        "conversation_id" : conversation.id,
        "sender" : request.user.username,
        "receiver" : second_user.username
    }
    return Response(data, status=200)

        


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

    if not user.friends.filter(username=username).exists():
        return Response({"error message" : "user not a friend"}, status=400)


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


# Get conversations
@api_view(['GET'])
def list_conversations(request):
    
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)
    user = request.user

    conversations = Conversation.objects.filter(participants=request.user)
    data = []
    
    for conv in conversations:
        other_user = conv.participants.exclude(id=user.id).first()
        if other_user:
            data.append({
                "conversation id" : conv.id,
                "sender" : user.username,
                "receiver" : other_user.username,
                "receiver_avatar" : other_user.avatar.url if other_user.avatar else None
            })

    return Response(data, status=200)

# Get messages for a user
@api_view(['GET'])
def get_messages(request, conv_id):


    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)
    conversations = Conversation.objects.filter(id=conv_id).first()

    if not conversations:
        return Response({"error message" : "no conversation exist"}, status=404)
    if not conversations.participants.filter(username=request.user.username).exists():
        return Response({"error message" : "user doesnt belong to the conversation"}, status=404)

    messages = Message.objects.filter(conversation=conversations)

    data = []
    for message in messages:
        data.append({
            "id": message.id,
            "message" : message.message,
            "sender" : message.sender.username,
            "created_at" : message.created_at
        })
    return Response(data, status=200)


# Get unread conversations
@api_view(['GET'])
def get_unread(request):

    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)
    
    conversations = Conversation.objects.filter(participants=request.user)

    data = []
    for conv in conversations:
        messages = Message.objects.filter(conversation=conv,is_read=False).exclude(sender=request.user)
        unread_messages = messages.count()
        if messages.exists():
            data.append({
                "conversation id" : conv.id,
                "sender" : messages.first().sender.username,
                "unread_messages" : unread_messages
            })
    
    return Response(data, status=200)


# Mark message as seen
@api_view(['POST'])
def mark_as_seen(request):

    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)

    conv_id = request.data.get('conversation_id')
    conversations = Conversation.objects.filter(id=conv_id)

    if not conversations.exists():
        return Response({"error message" : "conversation doesnt exist"}, status=404)
    if not conversations.first().participants.filter(username=request.user.username).exists():
        return Response({"error message" : "user doesnt belong in the conversation"}, status=404)

    messages = Message.objects.filter(conversation=conversations.first(), is_read=False).exclude(sender=request.user)
    if messages.exists():
        messages.update(is_read=True)
    return Response({"message" : "all good"}, status=200)



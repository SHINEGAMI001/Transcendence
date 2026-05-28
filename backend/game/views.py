from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Game, Queue, GameInvites


def game_home(request):
    return render(request, "game/index.html")


# Create game model and return game id
@api_view(['POST'])
def create_game(request):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)

    # Get necessary data from request body
    queue_id = request.data.get('queue_id')
    game_type = request.data.get("type")
    if not queue_id or not game_type:
        return Response({"error message" : "invalid data"}, status=400)
    queue = Queue.objects.filter(id=queue_id).first()
    if not queue:
        return Response({"error message" : "queue not found"}, status=404)

    team_a = list(queue.team_a.values_list('username', flat=True))
    team_b = list(queue.team_b.values_list('username', flat=True))

    if queue.owner != request.user:
        return Response({"error message" : "cant start the game you are not the owner"}, status=400)

    # Validate players size in game
    # Public needs at least one player in game
    # Private needs at least two players in game
    if game_type == 'public':
        if not team_a and not team_b:
            return Response({"error message" : "needs at least one player to start public game"}, status=402)
    else:
        if not team_a or not team_b:
            return Response({"error message" : "needs at least two players to start private game"}, status=402)

    # Validate user is in a team
    if request.user.username not in team_a and request.user.username not in team_b:
        return Response({"error message" : "user not in any teams"}, status=400)

    # Validate total max players
    if len(team_a + team_b) > 6:
        return Response({"error message" : "max players 6 allowed"}, status=400)

    # Check users authentication in both teams
    users_a = queue.team_a.all()
    users_b = queue.team_b.all()

    # Update queue status
    if queue.status == 'waiting':
        queue.status = 'launched'
        queue.save()
    else :
        return Response({"error message" : "cant start another game"}, status=403)

    # Create the game row
    game = Game.objects.create(
        type=game_type,
        team_a_count = users_a.count(),
        team_b_count = users_b.count(),
        created_by=queue.owner,
    )

    # Add users to teams
    game.team_a.set(users_a)
    game.team_b.set(users_b)

    Data = {
        "response" : "success",
        "game_id" : str(game.id),
        "created_by" : game.created_by.username,
        "max_players" : game.max_players,
        "team_a_count" : game.team_a_count,
        "team_b_count" : game.team_b_count,
        "created_at" : game.created_at,
    }

    return Response(Data, status=200)


# Join user in a public game endpoint
@api_view(['POST'])
def add_player(request):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)

    game_id = request.data.get("game_id")
    queue_id = request.data.get("queue_id")

    game = Game.objects.filter(id=game_id).first()
    if not game:
        return Response({"error message" : "game doesnt exist"}, status=404)


    queue = Queue.objects.filter(id=queue_id).first()  # ← MISSING
    if not queue:
        return Response({"error message" : "queue doesnt exist"}, status=404)
    
    in_team_a = queue.team_a.filter(id=request.user.id).exists()
    in_team_b = queue.team_b.filter(id=request.user.id).exists()
    
    if not in_team_a and not in_team_b:
        return Response({"error message" : "user not in queue"}, status=403)
    
    # Determine which team user chose in queue
    team = "team_a" if in_team_a else "team_b"

    # Check current players count
    if game.team_a_count + game.team_b_count >= game.max_players:
        return Response({"error message" : "game full"}, status=402)


    # validate team and check if already in team
    # Add player to team

    already_in_game = (
    game.team_a.filter(id=request.user.id).exists()
    or
    game.team_b.filter(id=request.user.id).exists()
)

    if already_in_game:
        return Response(
        {"error message": "user already in game"},
        status=409
    )

    if team in ["team_a", "team_b"]:
        if team == "team_a":
            game.team_a.add(request.user)
            game.team_a_count = game.team_a.count()
        else:
            game.team_b.add(request.user)
            game.team_b_count = game.team_b.count()
    else:
        return Response({"error message" : "invalid team"}, status=404)
    
    game.save()
        
    return Response({"message" : "player added to the game",
                    "user" : request.user.username,
                    "team" : team,
                    "players_count" : game.team_a_count + game.team_b_count,
                    "game_id" : str(game.id)})



# List all current public games
@api_view(['GET'])
def list_games(request):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)

    games = Game.objects.filter(type='public')
    if not games.exists():
        return Response({"message" : "no games for now"}, status=204)

    games_count = games.count()
    games_data = []
    for game in games:
        games_data.append({
            "id" : game.id,
            "type" : game.type,
            "team_a_count" : game.team_a_count,
            "team_b_count" : game.team_b_count,
            "max_players" : game.max_players,
            "created_by" : game.created_by.username,
            "created_at" : game.created_at,
            "team_a_members" : [m.username for m in game.team_a.all()],
            "team_b_members" : [m.username for m in game.team_b.all()],
        })
    
    return Response({
        "message" : "all games",
        "games_count" : games_count,
        "listed_games" : games_data
    }, status=200)


# Leave game endpoint
@api_view(['POST'])
def leave_game(request):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)
    
    game_id = request.data.get('game_id')
    queue_id = request.data.get('queue_id')

    if not game_id or not queue_id:
        return Response({"error message" : "invalid data"}, status=400)
    
    queue = Queue.objects.filter(id=queue_id).first()
    game = Game.objects.filter(id=game_id).first()
    if not queue or not game:
        return Response({"error message" : "user not in game"}, status=404)
    
    # Remove from game
    game.team_a.remove(request.user)
    game.team_b.remove(request.user)
    game.team_a_count = game.team_a.count()
    game.team_b_count = game.team_b.count()
    game.save()

    # Remove from queue
    queue.team_a.remove(request.user)
    queue.team_b.remove(request.user)

    return Response({"message" : "user left the game",
                     "user" : request.user.username}, status=200)

# End game endpoint
@api_view(['POST'])
def end_game(request):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)

    queue_id = request.data.get('queue_id')
    game_id = request.data.get('game_id')

    if not game_id or not queue_id:
        return Response({"error message" : "invalid data"}, status=400)
    
    queue = Queue.objects.filter(id=queue_id).first()
    game = Game.objects.filter(id=game_id).first()
    if queue:
        queue.delete()
    if game:
        game.delete()
    
    return Response({"message" : "game ended"}, status=200)
    

# ________________________________________________________________________________
# Invites apis

# Invite a user to a game
@api_view(['POST'])
def send_invite(request):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)
    
    invitee = request.data.get('invitee')
    queue_id = request.data.get('queue_id')
    User = get_user_model()



    # Check invited user existence
    invitee_user = User.objects.filter(username=invitee)
    if not invitee_user.exists():
        return Response({"error message" : "user not found"}, status=400)
    
    queue = Queue.objects.filter(id=queue_id)
    if not queue.exists():
        return Response({"error message" : "queue doesnt exist"}, status=400)
    
    # Check if game has max players
    queue_obj = queue.first()
    current_players = queue_obj.team_a.count() + queue_obj.team_b.count()
    max_players = 6  # or whatever your max is

    if current_players >= max_players:
        return Response({"error message": "queue is full"}, status=400)
    
    # Check if there alread a pending request
    existing_invite = GameInvites.objects.filter(
    inviter=request.user,
    invitee=invitee_user.first(),
    queue=queue.first(),
    status='pending'
    ).exists()

    if existing_invite:
        return Response(
        {"error message": "invite already sent"},
        status=409
    )

    # Create invite
    invite = GameInvites.objects.create(
        inviter = request.user,
        invitee = invitee_user.first(),
        queue = queue.first()
    )



    # Send websocket notification
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    channel = get_channel_layer()
    async_to_sync(channel.group_send)(
        f'notification_{invite.invitee.id}',{
            'type' : 'invite_notify',
            'info' : "game invite",
            'sender' : request.user.username,
            'invite_id': invite.id,
            'queue_id': invite.queue.id,
            'created_at' : str(invite.created_at)
        }
    )

    return Response({"message" : "invite created",
                     "invite_id" : invite.id,
                     "inviter" : invite.inviter.username,
                     "invitee" : invite.invitee.username,
                     "queue_id" : invite.queue.id,
                     "invite_status" : invite.status}, status=200)

# Accept game invite
@api_view(['POST'])
def accept_invite(request):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)
    
    invite_id = request.data.get("invite_id")
    if not invite_id:
        return Response({"error message" : "no invite id"}, status=400)
    
    invite = GameInvites.objects.filter(id=invite_id)
    if not invite.exists():
        return Response({"error message" : "no invite found"}, status=400)

    if request.user.username != invite.first().invitee.username:
        return Response({"error message" : "you are not the invitee"}, status=403)
    
    if invite.first().status != 'pending':
        return Response({"error message" : f"invite already {invite.first().status}"}, status=401)
    
    invite.first().status = 'accepted'
    invite.first().save()

    if not invite.first().queue or invite.first().queue.status == 'launched':
        return Response({"error message" : "cant join queue"}, status=403)

    return Response({"message" : "user accepted invite",
                     "user" : request.user.username,
                     "inviter" : invite.first().inviter.username,
                     "invite_id" : invite.first().id,
                     "queue_id" : invite.first().queue.id,
                     }, status=200)

# Reject game invite api
@api_view(['POST'])
def reject_invite(request):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)
    
    invite_id = request.data.get('invite_id')
    if not invite_id:
        return Response({"error message" : "no invite id"}, status=400)

    invite = GameInvites.objects.filter(id=invite_id)
    if not invite.exists():
        return Response({"error message" : "invite doesnt exist"}, status=400)
    
    if invite.first().invitee.username != request.user.username:
        return Response({"error message" : "you are not the invitee"}, status=403)
    
    if invite.first().status != 'pending':
        return Response({"error message" : f"invite already {invite.first().status}"}, status=409)

    invite.first().status = 'rejected'
    invite.first().save()

    return Response({"message" : "user rejected invite",
                     "user" : request.user.username,
                     "inviter" : invite.first().inviter.username,
                     "invite_id" : invite.first().id,
                     "status" : invite.first().status}, status=200)

# List game invites for a user
@api_view(['GET'])
def list_invites(request):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)
    
    invites = GameInvites.objects.filter(invitee=request.user, status='pending')
    if not invites.exists():
        return Response({"message" : "no pending invites for now"}, status=204)

    invites_data = []
    for invite in invites:
        invites_data.append({
            "invite_id" : invite.id,
            "sender" : invite.inviter.username,
            "status" : invite.status
        })
    
    return Response({"message" : "pending invites",
                     "invites_count" : invites.count(),
                     "invites" : invites_data}, status=200)


# Invite status for inviter
@api_view(['GET'])
def invite_status(request, invite_id):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)

    invite = GameInvites.objects.filter(id=invite_id).first()
    if not invite:
        return Response({"error message" : "no invite found"}, status=404)
    
    return Response({"message" : "invite status",
                     "status" : invite.status,
                     "invite_id" : invite_id,
                     "inviter" : invite.inviter.username,
                     "invitee" : invite.invitee.username}, status=200)


# ________________________________________________________________________________
# Queue apis

# Create queue
@api_view(['POST'])
def create_queue(request):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)
    
    queues = Queue.objects.filter(owner=request.user)
    in_team_a = Game.objects.filter(team_a=request.user).first()
    in_team_b = Game.objects.filter(team_b=request.user).first()

    game_id = None
    if in_team_a:
        game_id = in_team_a.id
    elif in_team_b:
        game_id = in_team_b.id

    if queues.exists():
        return Response({"error message" : "user already in queue",
                         "queue_id" : queues.first().id,
                         "game_id" : game_id if game_id else None}, status=409)

    if Queue.objects.filter(team_a=request.user).exists() or Queue.objects.filter(team_b=request.user).exists():
        return Response({"error message" : "user already in queue",
                         "queue_id" : queues.first().id,
                         "game_id" : game_id if game_id else None}, status=409)
    
    queue = Queue.objects.create(
        owner = request.user
    )
    return Response({"message" : "queue created",
                     "queue_id" : queue.id,
                     "owner" : request.user.username,
                     }, status=200)

# lock team in queue
@api_view(['POST'])
def choose_team(request):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)
    
    queue_id = request.data.get('queue_id')
    team = request.data.get('team')

    if not queue_id:
        return Response({"error message" : "no queue id"}, status=400)
    
    if not team or team not in ['team_a', 'team_b']:
        return Response({"error message" : "invalid team"}, status=400)
    
    queue = Queue.objects.filter(id=queue_id)
    if not queue.exists():
        return Response({"error message" : "queue not found"}, status=400)
    
    if queue.first().status == 'waiting':
        queue.first().team_a.remove(request.user)
        queue.first().team_b.remove(request.user)
        if team == 'team_a':
            queue.first().team_a.add(request.user)
        else:
            queue.first().team_b.add(request.user)

    else:
        return Response({"error message" : "queue already launched"}, status=400)
    
    return Response({"message" : "user picked team",
                     "queue_id" : queue.first().id,
                     "user" : request.user.username,
                     "team" : team,
                     "team_a_count" : queue.first().team_a.count(),
                     "team_b_count" : queue.first().team_b.count()}, status=200)

# Leave queue
@api_view(['POST'])
def leave_queue(request):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)

    queue_id = request.data.get('queue_id')
    if not queue_id:
        return Response({"error message" : "no queue id"}, status=400)
    
    queue = Queue.objects.filter(id=queue_id)
    if not queue.exists():
        return Response({"error message" : "no queue found"}, status=400)
    
    if queue.first().owner.username == request.user.username:
        queue.first().delete()
        return Response({"message" : "queue owner left, queue deleted",
                         "queue_id" : queue_id}, status=200)
    
    queue.first().team_a.remove(request.user)
    queue.first().team_b.remove(request.user)

    return Response({"message" : "user left the queue",
                     "queue_id" : queue_id,
                     "user" : request.user.username,
                     "team_a_count" : queue.first().team_a.count(),
                     "team_b_count" : queue.first().team_b.count()
                     }, status=200)
    

# List Queue details
@api_view(['GET'])
def list_queue(request, queue_id):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)

    if not queue_id:
        return Response({"error message" : "no queue id"}, status=400)
    queue = Queue.objects.filter(id=queue_id).first()
    if not queue:
        return Response({"error message" : "queue not found"}, status=400)

    team_a_users = list(queue.team_a.values_list('username', flat=True))
    team_b_users = list(queue.team_b.values_list('username', flat=True))
    

    queue_data = {
        "queue_id" : queue_id,
        "owner" : queue.owner.username,
        "status" : queue.status,
        "team_a_users" : team_a_users,
        "team_b_users" : team_b_users,
        "team_a_count" : len(team_a_users),
        "team_b_count" : len(team_b_users),
    }

    if queue.status == 'launched':
        game = Game.objects.filter(created_by=queue.owner).order_by('-created_at').first()
        if game:
            queue_data["game_id"] = str(game.id)

    return Response({"message" : "queue details",
                     "details" : queue_data}, status=200)

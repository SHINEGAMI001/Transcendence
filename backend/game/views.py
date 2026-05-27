from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Game


def game_home(request):
    return render(request, "game/index.html")


# Create game model and return game id
@api_view(['POST'])
def create_game(request):
    if not request.user.is_authenticated:
        return Response({"error message" : "user not online"}, status=401)

    # Get necessary data from request body
    game_type = request.data.get("type")
    team_a = request.data.get("team_a", [])
    team_b = request.data.get("team_b", [])
    created_by = request.data.get("created_by")


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
        return Response({"error message" : "user not in any teams"}, status=404)

    # Validate total max players
    if len(team_a + team_b) > 6:
        return Response({"error message" : "max players 6 allowed"})

    # Check users authentication in both teams
    User = get_user_model()
    try:
        users_a = User.objects.filter(username__in=team_a)
        users_b = User.objects.filter(username__in=team_b)

        if users_a.count() != len(team_a) or users_b.count() != len(team_b):
            return Response({"error message" : "some users are not found"}, status=404)

    except Exception as e:
        return Response({"error message" : str(e)}, status=404)


    # Create the game row
    game = Game.objects.create(
        type=game_type,
        team_a_count = len(users_a),
        team_b_count = len(users_b),
        created_by=User.objects.filter(username=created_by).first(),
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
    team = request.data.get("team")

    game = Game.objects.filter(id=game_id).first()
    if not game:
        return Response({"error message" : "game doesnt exist"}, status=404)

    # Check current players count
    if game.team_a_count + game.team_b_count >= game.max_players:
        return Response({"error message" : "game full"}, status=402)


    # validate team and check if already in team
    # Add player to team
    if team in ["team_a", "team_b"]:
        if team == "team_a":
            user = game.team_a.filter(username=request.user.username).first()
            if user:
                if request.user.username == user.username:
                    return Response({"error message" : "user already in team"}, status=405)

            game.team_a.add(request.user)
            game.team_a_count += 1
        else:
            user = game.team_b.filter(username=request.user.username).first()
            if user:
                if request.user.username == user.username:
                    return Response({"error message" : "user already in team"}, status=405)

            game.team_b.add(request.user)
            game.team_b_count += 1
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

# End game endpoint
    


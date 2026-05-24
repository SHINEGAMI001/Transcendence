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

    


from django.shortcuts import render

def game_home(request):
    return render(request, "game/index.html")

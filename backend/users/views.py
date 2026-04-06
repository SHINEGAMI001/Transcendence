from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import get_user_model

def users(request):
    data = {
            "message" : "api endpoint is working",
            "usage" : "go to api/auth/register for register endpoint"
            }
    return JsonResponse(data)

# register api
@api_view(['POST'])
def register(request):

        # check json data content
        if not request.data:
                return Response({"error message" : "cant accept empty parameters"})
        if not request.data.get("username"):
                return Response({"error message" : "missing username"})
        elif not request.data.get("password"):
                return Response({"error message" : "missing password"})
        elif not request.data.get("email"):
                return Response({"error message" : "missing email"})

        # get the default User model (User datatable)
        user = get_user_model()

        if user.objects.filter(username=request.data["username"]).exists():
                return Response({"error message" : "username already exists"})
        elif user.objects.filter(email=request.data["email"]).exists():
               return Response({"error message" : "email address already exists"})
        else:
                user.objects.create_user(
                        username=request.data['username'],
                        email=request.data['email'],
                        password=request.data['password']
                        )
        return Response({'message' : 'account created'})



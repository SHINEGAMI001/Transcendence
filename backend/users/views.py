from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse

def users(request):
    data = {
            "message" : "api endpoint is working",
            "usage/" : {
                  "admin" : "localhost:8000/admin",
                  "register" : "localhost:8000/api/auth/register",
                  "login" : "localhost:8000/api/auth/login",
                  "profile" : "localhost:8000/api/profile/me"
                  }
            }
    return JsonResponse(data)

# register api
@api_view(['POST'])
def register(request):

        # if empty data
        if not request.data:
                return Response({"error message" : "cant accept empty parameters"})

        # check keys and values
        if not request.data.get("username"):
                return Response({"error message" : "missing username"})
        elif not request.data.get("password"):
                return Response({"error message" : "missing password"})
        elif not request.data.get("email"):
                return Response({"error message" : "missing email"})

        # get the default User model (User datatable)
        user = get_user_model()

        if user.objects.filter(username=request.data["username"]).exists():
                return Response({"error message" : "username already exists"}, status=400)
        elif user.objects.filter(email=request.data["email"]).exists():
               return Response({"error message" : "email address already exists"}, status=400)
        else:
                user.objects.create_user(
                        username=request.data['username'],
                        email=request.data['email'],
                        password=request.data['password']
                        )
        return Response({'message' : 'account created'})

# login api
@api_view(['POST'])
def login_view(request):

    if not request.data: # if empty data
           return Response({"error message" : "cant accept empty parameters"})
    
    if not request.data.get('username'):
        return Response({"error message" : "expected 'username'"})
    elif not request.data.get("password"):
        return Response({"error message" : "expected 'pass'"})
    
    username = request.data['username']
    password = request.data['password']

    user = authenticate(username=username, password=password) # search by username and compare hashed password
    if user:
        login(request, user) # save user id in django session
        return Response({"message" : "login success"})
    else:
        return Response({"error message" : "username or password is incorrect"})


#profile api
@api_view(['GET'])
def profile(request):

    if not request.user.is_authenticated: # check if user logged in
        return Response({"error_message" : "user not logged in"}, status=401)
    
    response = {
          "id" : request.user.id,
          "username" : request.user.username,
          "email" : request.user.email,
          "date_joined" : request.user.date_joined,
          "last_login" : request.user.last_login,
          "xp" : request.user.xp,
          "level" : request.user.level,
          "wins" : request.user.wins,
          "losses" : request.user.losses,
          "avatar" : request.user.avatar.url,
    }

    return Response(response)

# update avatar api
@api_view(['PUT'])
def update_avatar(request):
      if not request.user.is_authenticated: # check if user connected first
            return Response({"error message" : "user not online"}, status=401)
      avatarr = request.FILES.get('avatar') # get the requested avatar
      if not avatarr:
            return Response({"error message" : "no image uploaded"}, status=400)
      # print(f"file format : {avatarr.content_type}", flush=True)

      allowed_formats = ['image/jpg', 'image/jpeg', 'image/gif', 'image/png', 'image/webp']
      if avatarr.content_type not in allowed_formats: # validate image type
            return Response({"error message" : "file format not allowed"}, status=400)
      
      max_size = 7 * 1024 * 1024
      if avatarr.size > max_size: # check image size
            return Response({"error message" : "max image size 7MB"}, status=413)
      
      if request.user.avatar and request.user.avatar.name != 'default/speed.gif':
            request.user.avatar.delete() # delete old avatar
      request.user.avatar = avatarr # update and save avatar into user profile
      request.user.save()

      return Response({"message" : "avatar updated succesfuly"}, status=200)


# logout api
@api_view(['GET'])
def logout_view(request):
        if request.user.is_authenticated:
                logout(request)
                return Response({"message": "user logged out successfully"}, status=200)

        return Response({"error message": "user not logged in"}, status=401)

# update profile api
@api_view(['GET', 'PUT'])
def update_profile(request):
        if not request.user.is_authenticated:
                return Response({"error message": "user not online"}, status=401)
        
        username = request.data.get("username")
        email = request.data.get("email")
        
        if not username and not email:
                return Response({"error message": "bad request: expected <username> or <email>"}, status=400)
        
        User = get_user_model()
        
        if username:
                # Allow if username is same as current user
                if username != request.user.username and User.objects.filter(username=username).exists():
                        return Response({'error message': 'username taken'}, status=409)
                request.user.username = username
                request.user.save()
                return Response({"message": "username updated successfully"}, status=200)
        
        if email:
                # Allow if email is same as current user email
                if email != request.user.email and User.objects.filter(email=email).exists():
                        return Response({"error message": "email taken"}, status=409)
                request.user.email = email
                request.user.save()
                return Response({"message": "email updated successfully"}, status=200)


# Delete profile api
@api_view(['GET', 'DELETE'])
def delete_view(request):
        if not request.user.is_authenticated:
                return Response({"error message" : "user not online"}, status=401)
        # print(f"user methods: {dir(request.user)}", flush=True)
        request.user.delete()
        logout(request)
        return Response({"message" : "user deleted"}, status=200)

 
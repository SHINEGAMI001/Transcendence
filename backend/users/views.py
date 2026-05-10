from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from .models import FriendRequest

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

# Advanced search api
@api_view(['GET'])
def advanced_search(request):
        User = get_user_model()
        users = User.objects.all()

        # searched user
        searched_user = request.GET.get('q', '')
        if searched_user:
                users = users.filter(username__icontains=searched_user)

        # filter
        level = request.GET.get('level')
        if level:
               users = users.filter(level=level)
        
                # greater than
        level_gt = request.GET.get('level_gt')
        if level_gt:
               users = users.filter(level__gt=level_gt)
        
                # less than
        level_lt = request.GET.get('level_lt')
        if level_lt:
               users= users.filter(level__lt=level_lt)

        xp = request.GET.get('xp')
        if xp:
               users = users.filter(xp=xp)

        xp_gt = request.GET.get('xp_gt')
        if xp_gt:
               users = users.filter(xp__gt=xp_gt)
        
        xp_lt = request.GET.get('xp_lt')
        if xp_lt:
               users = users.filter(xp__lt=xp_lt)

        # sorting
        allowed_fields = ['id', 'xp', 'level', 'wins', 'losses']
        order = request.GET.get('order')
        desc = request.GET.get('desc')
        if order and order in allowed_fields:
                if desc in ('true', '1', 'yes'):
                        users = users.order_by('-' + order)
                else:
                        users = users.order_by(order)
        else:
                if desc in ('true', '1', 'yes'):
                        users = users.order_by('-' + 'id')
                else:
                        users = users.order_by('id')

        # pagination
        from django.core.paginator import Paginator

        # users = users.order_by('id')
        page_size = request.GET.get('page_size', 3)
        p = Paginator(users, page_size)
        page = request.GET.get('page', 1)
        data = p.get_page(page)

        result = []
        for user in data:
               d = {"username" : user.username,
                    "id" : user.id,
                    "wins" : user.wins,
                    "losses" : user.losses,
                    "avatar" : user.avatar.url}
               result.append(d)
        
        response = {
               "message" : "all infomation",
               "current page" : data.number,
               "number of pages" : p.num_pages,
               "number of users found" : p.count,
               "current data" : result
        }

        return Response(response)

# public profile for user
@api_view(['GET'])
def pub_profile(request, username):
        User = get_user_model()
        response = []
        if username:
                if User.objects.filter(username=username).exists():
                        user = User.objects.get(username=username)
                        response = {
                               "username" : user.username,
                               "id" : user.id,
                               "email" : user.email,
                               "level" : user.level,
                               "xp" : user.xp,
                               "wins" : user.wins,
                               "losses" : user.losses,
                               "avatar" : user.avatar.url,
                        }
                        return Response(response, status=201)
                else:
                     response = {"error message" : "user doesnt exist"}
                     return Response(response, status=401)
        else:
              response = {"error message" : "empty field not allowed"}
              return Response(response, status=404)
        
# -------------------------------------------------------------------------------------------------------       
# Friend requests endpoints
@api_view(['GET', 'POST'])
def send_request(request):
        if not request.user.is_authenticated:
                return Response({"error message" : "user not online"}, status=401)

        User = get_user_model()
        if not User.objects.filter(username=request.data.get('username')).exists():
               return Response({"error message" : "user doesnt exist"}, status=402)
        
        send_to = User.objects.get(username=request.data.get('username'))
        
        
        if send_to == request.user:
               return Response({"error message" : "cant send a friend request to urself"}, status=405)
        
        if FriendRequest.objects.filter(from_user=request.user, to_user=send_to, status='pending').exists():
                        return Response({"error message" : "already have a friend request to this user"}, status=406)

        if FriendRequest.objects.filter(from_user=send_to, to_user=request.user, status='pending').exists():
               return Response({"error message" : "already have a friend request from this user"}, status=406)

        FriendRequest.objects.create(
               from_user = request.user,
               to_user = send_to,
        )


        return Response({"message" : "friend request sent succsesfuly"}, status=200)

# Get all pending requests
@api_view(['GET'])
def friend_requests(request):
        if not request.user.is_authenticated:
              return Response({"error message" : "user not online"}, status=401)

        requests = FriendRequest.objects.filter(to_user=request.user, status='pending')


        data = []
        for req in requests:
                data.append({
                      'request_id' : req.id,
                      'from_user' : req.from_user.username,
                      'created_at' : req.created_at 
                })
        if data:
               return Response({"pending requests" : data}, status=200)
        else:
               return Response({"message" : "no pending requests"}, 200)


# Accept a friend request
@api_view(['POST'])
def accept_request(request):
        if not request.user.is_authenticated:
              return Response({"error message" : "user not online"}, status=401)

        request_id = request.data.get('request_id')

        req = FriendRequest.objects.get(id=request_id)
        if request.user == req.to_user:
               req.status = "accepted"
               req.save()
               request.user.friends.add(req.from_user)
               req.from_user.friends.add(request.user)
               return Response({"message" : "user added to friends"}, status=200)
        else:
               return Response({"message" : "cant accept friend request"}, status=402)


# Reject a friend request
@api_view(['POST'])
def reject_request(request):
        if not request.user.is_authenticated:
              return Response({"error message" : "user not online"}, status=401)
       
        request_id = request.data.get("request_id")

        req = FriendRequest.objects.get(id=request_id)
        req.status = "rejected"
        req.save()
        return Response({"message" : "friend request rejected"}, status=402)


# Remove a friend
@api_view(['POST'])
def remove_friend(request):
        if not request.user.is_authenticated:
              return Response({"error message" : "user not online"}, status=401)


        username = request.data.get('username')
        if not request.user.friends.filter(username=username).exists():
               return Response({"error message" : "user not in friends"}, status=406)

        User = get_user_model()
        userr = User.objects.get(username=username)
        request.user.friends.remove(userr)
        userr.friends.remove(request.user)
        return Response({"message" : "friend removed"}, status=200)


# List friends
@api_view(['GET'])
def list_friends(request):
        if not request.user.is_authenticated:
              return Response({"error message" : "user not online"}, status=401)

        friends_data = []
        all_friends = request.user.friends.all()
        for friend in all_friends:
               friends_data.append({
                      "id" : friend.id,
                      "username" : friend.username,
               })
        num_friends = request.user.friends.count()

        response = {
               "response" : "list of friends",
               "number of friends" : num_friends,
               "friends" : friends_data,
        }
        
        return Response(response, status=200)
               
       
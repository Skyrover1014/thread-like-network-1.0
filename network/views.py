from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from functools import wraps
from django.db import IntegrityError, DatabaseError, OperationalError,transaction
from django.http import HttpResponse, HttpResponseRedirect
from django.http import JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator

from .models import User, Post, Follow
import json
from json import JSONDecodeError

class ApiException(Exception):
    def __init__(self, message, status_code=400):
        super.__init__(message)
        self.status_code = status_code

def index(request):
    if request.user.is_authenticated:
        auth_user = request.user
        
        try:
            auth_user_data = User.objects.get(pk=auth_user.id)
        except User.DoesNotExist:
            return error_response("Index: Auth_user not found.",status=404)

        return render(request,"network/index.html", {
            "auth_user":auth_user_data.serialize()
        })
    else:
        # return HttpResponseRedirect(reverse("login"))
        return render(request, "network/index.html")

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        
        if not username or not email or not password or not confirmation:
            return render(request, "network/register.html", {
                "message": "All fields are required."
            })


        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

def require_method(method):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if request.method != method:
                return JsonResponse({"error":f"{method} request required"}, status=405)
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator

def parse_json(request):
    try:
        return json.loads(request.body)
    except JSONDecodeError:
        return None

def error_response(message, status=400):
    return JsonResponse({"error":message}, status=status)

def success_response(message, data=None, status=200):
    return JsonResponse({
        "message": message,
        "data": data or {}
    }, status=status)



@csrf_exempt
@login_required
@require_method("POST")
def create_post(request):
    poster = request.user
    
    data = parse_json(request)
    if data is None:
        return error_response("Create_post: Invalid JSON data.", status=400)
   
    content = data.get("content","").strip()
    if not content:
        return error_response("Create_post: Content cannot be empty", status=400 )
    try:
        post = Post.objects.create(poster=poster, content=content)
        return success_response( "Post created successfully",{
            "post":post.serialize(),
        },201)
    except IntegrityError as ie:
        return error_response(f"Integrity error in create_post:: {str(ie)}", status=400)
    except Exception as e:
        return error_response(f"Create_post: {str(e)}", status=500)


@csrf_exempt
@require_method("GET")
def load_post(request):
    auth_user = request.user if request.user.is_authenticated else None
    try:
        page_number = int(request.GET.get('page',1))
    except ValueError:
        return error_response("Load_post: Page number must be an integer.", status=400)
    profile_id = request.GET.get('user_id',None)
    if profile_id is not None and profile_id != "":
        try:
            profile_id= int(profile_id)
        except ValueError:
            return error_response("Load_post: User ID must be an integer.", status=400)

    page_type = request.GET.get('page_type',"home-page")
 
    try:
        posts = filter_posts(page_type, auth_user, profile_id)
    except Exception as e:
        return error_response(f"Load post: {str(e)}")
    
    data, error = pagination_queryset(posts,page_number,auth_user)
    if error:
        return error_response(f"Load_post: {error}", status=500) 
    return success_response("Load the page successfully",data, status=200)

## helper function:
def filter_posts(page_type, auth_user, profile_id):
    try:
        if page_type == "following-posts-page":
            if not auth_user:
                raise ApiException("Authentication required for following-posts-page.", status_code=401)
            following_list = Follow.objects.filter(follower=auth_user).select_related("following")
            following_users = [following.following for following in following_list]
            posts = Post.objects.filter(poster__in=following_users).order_by('-created_time')
        elif page_type == "home-page":
            posts = Post.objects.all().order_by('-created_time')
        else:
            posts = Post.objects.filter(poster=profile_id).order_by('-created_time')
        posts =posts.select_related("poster").prefetch_related("likes")
    except Follow.DoesNotExist:
        raise Exception(f"filter_posts: Follow doesn't found")
    except (DatabaseError, OperationalError) as de:
        raise ApiException(f"Database Error in filter_post: {str(de)}",status_code=500)            
    return posts 

## helper function:
def pagination_queryset(posts,page_number,auth_user):
    posts_per_page = 10
    paginator = Paginator(posts,posts_per_page)

    if page_number > paginator.num_pages or page_number < 1:
        return None, "Invalid page number"
    page = paginator.get_page(page_number)

    data ={
        "posts":[post.serialize(auth_user) for post in page.object_list],
        "current_page":page_number,
        "total_page":paginator.num_pages,
        "has_next":page.has_next(),
        "has_previous":page.has_previous(),
        "next_page":page.next_page_number() if page.has_next() else None,
        "previous_page":page.previous_page_number() if page.has_previous() else None,
    }
    return data, None




@csrf_exempt
@login_required
@require_method("PUT")
def update_post(request,post_id):
    auth_user_id = request.user.id

    data = parse_json(request)
    post_id = int(post_id)
    poster_id = int(data.get("poster_id"))

    updated_content = data.get("content","").strip()
    if not updated_content:
        return error_response("Update_post: Updated content is required.",400)
    if poster_id != auth_user_id:
        return error_response("Update_post: Don't have the permission to edit this post.",400)
    try:
        with transaction.atomic():
            # target_post = Post.objects.select_related("poster").prefetch_related("likes").get(pk=post_id, poster_id=poster_id)
            target_post = Post.objects.only("content").get(pk=post_id, poster_id=poster_id)
            target_post.content = updated_content
            target_post.save()
        return success_response( "Post updated successfully",{
            "updated_post":target_post.serialize()
            },status=201)
    except Exception as e:
        return error_response(f"Update_post:{str(e)}",status=500)




@csrf_exempt
@require_method("PUT")
def like_post(request,post_id):
    post_id = int(post_id)
    auth_user = request.user if request.user.is_authenticated else None

    if auth_user == None:
        return error_response("Like_post:User need to login", status=404)

    try: 
        post = Post.objects.select_related("poster").prefetch_related("likes").get(pk=post_id)
        
    except Post.DoesNotExist:
        return error_response("Like_post: Post not found", status=404)
    
    try:
        is_like, liked_user_ids = like_or_unlike(post,auth_user)
        data =post.serialize(auth_user,["likes","is_like","likes_count"],is_like, liked_user_ids) 
    except Exception as e: 
        return error_response(f"Like_post:{str(e)}", status=500)
    
    return success_response("Like the post successfully" if data["is_like"] else "Unlike the post successfully",{
        "post":data
    }, status=200)

## helper function
def like_or_unlike(post,auth_user):

    try:
        liked_user_ids = set(user.id for user in post.likes.all())
        if auth_user.id in liked_user_ids:
            post.likes.remove(auth_user)
            return False,liked_user_ids 
        else:
            post.likes.add(auth_user) 
            return True ,liked_user_ids

    except Exception as e:
            raise Exception(f"Error in like_or_unlike: {str(e)}") 




@csrf_exempt
@require_method("GET")
def profile (request, user_id):
    auth_user = request.user if request.user.is_authenticated else None

    try:
        profile_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return error_response("Profile: User not found.",status=404)
    try:
        follow_state = Follow.objects.filter(follower=auth_user,following=profile_user).exists()
    except Exception as e:
        return error_response(f"Profile:{str(e)}", status=500)
    
    try:
        followers = serialize_follow_lists(auth_user, profile_user, "followers")
        followings =serialize_follow_lists(auth_user,profile_user, "followings")
    except ApiException as ae:
        return error_response(f"Profile:{str(ae)}", status=ae.status_code)
    except Exception as e:
        return error_response(f"Profile:{str(e)}", 500)
   
    return success_response("Get profile Successfully",{
        "profile_user": profile_user.serialize(),
        "id":profile_user.id,
        "follow_state":follow_state,
        "follower_list":followers,
        "following_list":followings,
    },status=200)




@csrf_exempt
@require_method("PUT")
def follow(request,user_id):
    follower_id = request.user
    auth_user = request.user if request.user.is_authenticated else None
    if auth_user == None:
        return error_response("Follow:User need to login", status=404)
    data = parse_json(request)
    follow_state = data.get("follow_state")
    try:
        target_user = User.objects.get(pk=user_id)
        following_id = target_user
    except User.DoesNotExist:
        return error_response("Follow: The targeted user do not found",status=404)

    try:
        new_follow_state, targetUser_Id, user = change_follow_state(follower_id, following_id, follow_state, target_user.id)
    except ApiException as ae:
         return error_response(f"Follow:{str(ae)}", status=ae.status_code)
    except Exception as e:
        return error_response(f"Follow:{str(e)}", status=500)

    try:
        new_followers = serialize_follow_lists(auth_user, target_user,"followers")
        new_followings = serialize_follow_lists(auth_user,target_user, "followings")
    except ApiException as ae:
         return error_response(f"follow:{str(ae)}", status=ae.status_code)
    except Exception as e:
        return error_response(f"follow:{str(e)}", status=500)
    
    return success_response("Followed successfully" if new_follow_state else "Unfollowed successfully",{
        "follow_state": new_follow_state,
        "profile_user": user,
        "id":targetUser_Id,
        "follower_list":new_followers,
        "following_list":new_followings, 
    }, status=200)

## helper function
def change_follow_state(follower_id, following_id, follow_state,target_user):
    try:
        if follow_state == True:
            Follow.objects.get_or_create(follower=follower_id, following=following_id)
        else:
            Follow.objects.filter(following=following_id, follower=follower_id).delete()
        targetUser_data = User.objects.get(pk=target_user).serialize()
    except IntegrityError as ie:
        raise ApiException(f"Integrity error in change_follow_state_true:{str(ie)}", status_code =400 )
    except (DatabaseError, OperationalError) as de:
        raise ApiException(f"Database error in change_follow_state_true: {str(de)}", status_code =500)
    except User.DoesNotExist:
        raise Exception(f"change_follow_state: User doesn't found", status_code =400)
    
    targetUser_Id = targetUser_data["id"]
    user = {
        "id": targetUser_data["id"],
        "user":targetUser_data["user"],
        "email":targetUser_data["email"],
        "followers_count":targetUser_data["followers_count"],
        "following_count":targetUser_data["following_count"],
    }
    return follow_state, targetUser_Id, user


## helper function
def serialize_follow_lists(auth_user,profile_user,list_type):
    config= {
        "followers":{
            "filter_field": "following",
            "serialize_field": "follower"
        },
        "followings": {
            "filter_field": "follower",      
            "serialize_field": "following"  
        }
    }
    if list_type not in config:
        raise ValueError("Invalid list type.")
    cfg = config[list_type]
    try:
        follow_list = Follow.objects.select_related(cfg["serialize_field"]).filter(**{cfg["filter_field"]:profile_user})
        follow_items =[]
        for follow_item in follow_list:
            item_data = getattr(follow_item,cfg["serialize_field"]).serialize()
            follow_state = Follow.objects.filter(
                follower=auth_user,
                following= getattr(follow_item,cfg["serialize_field"])).exists()
            follow_items.append({**item_data, "follow_state":follow_state})
    except AttributeError as attr_err:
        raise ApiException(f"Attribute error in serialize_follow_list: {str(attr_err)}",status_code=500)
    except (DatabaseError, OperationalError) as de:
        raise ApiException(f"Database Error in serialize_follow_list: {str(de)}",status_code=500)
    return follow_items

@csrf_exempt
@login_required
@require_method("POST")
def change_profile_image(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    
        if 'image' in request.FILES:
            user.profile_image = request.FILES['image']
            user.save()
            return success_response("Profile_image Was Updated Successfully",{
                "profile_image": user.serialize()
            },status =201)
        else:
            return error_response("No image uploaded", 400)

    except User.DoesNotExist:
        return error_response("User no fount",404)
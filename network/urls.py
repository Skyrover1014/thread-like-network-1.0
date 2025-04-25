
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),


    path("api/new_post",views.create_post, name="create_post"), #POST
    path("api/posts/",views.load_post,name="load_post"), #GET
    path("api/posts/<int:post_id>/", views.update_post, name="update_post"),  # PUT 
    path("api/posts/<int:post_id>/like/", views.like_post, name="like_post"),  # PUT
    path("api/users/<int:user_id>/", views.profile, name="get_profile"),  # GET 
    path("api/users/<int:user_id>/follow/", views.follow, name="toggle_follow"),  #PUT
    path("api/users/<int:user_id>/new_profile_image",views.change_profile_image, name="change_profile_image") #POST
]

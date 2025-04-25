from django.contrib import admin
from .models import User, Follow, Post
# Register your models here.

class UserAdmin(admin.ModelAdmin):
    list_display =('username','email','followers_count','following_count','posts_count')

class FollowAdmin(admin.ModelAdmin):
    list_display =('follower', 'following')

class PostAdmin(admin.ModelAdmin):
    list_display = ('poster', 'content', 'likes_count', 'created_time')

admin.site.register(User, UserAdmin)
admin.site.register(Follow, FollowAdmin)
admin.site.register(Post, PostAdmin)
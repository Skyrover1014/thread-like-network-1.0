from django.contrib.auth.models import AbstractUser
from django.db import models
# from cloudinary.models import CloudinaryField



class User(AbstractUser):
   followers_count = models.PositiveIntegerField(default=0)
   following_count = models.PositiveIntegerField(default=0)
   posts_count = models.PositiveIntegerField(default=0)
#    profile_image = CloudinaryField('image', default='default_avatar_rwyl0z', blank=True, null=True)
#    profile_image = CloudinaryField('image', default='https://res.cloudinary.com/dj4xqzv8g/images/default_avatar.png')
   profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True,default='profile_images/default_avatar.png')

   def serialize(self):
       return {
           "id":self.id,
           "user":self.username,
           "email":self.email,
           "followers_count":self.followers_count,
           "following_count":self.following_count,
           "posts_count":self.posts_count,
           "profile_image": self.profile_image.url if self.profile_image and hasattr(self.profile_image, "url") else None

       }
   
class Post(models.Model):
    poster = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField(blank=True)
    created_time = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User,blank=True, related_name='liked_posts')
    likes_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.poster.username} at{self.created_time} :{self.content[:30]}"
    
    def serialize(self, auth_user = None, fields =None):
        full_data ={
            "id": self.id,
            "poster": self.poster.username,
            "poster_id":self.poster.id,
            "profile_image": self.poster.profile_image.url if self.poster.profile_image and hasattr(self.poster.profile_image, "url") else None,
            "content":self.content,
            "timestamp": self.created_time.strftime("%b %d %Y, %I:%M %p"),
            "created_time":self.created_time.isoformat(),
            "likes_count":self.likes_count,
            "likes":[user.username for user in self.likes.all()],
            "is_like":self.likes.filter(id=auth_user.id).exists() if auth_user else False 
        }
        if fields:
            return {field:full_data[field] for field in fields if field in full_data}
        return full_data
class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="follower")

    class Meta:
        unique_together = ('follower', 'following')
        indexes = [
            models.Index(fields=['follower', 'following'])
        ]
    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"
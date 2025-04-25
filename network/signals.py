from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from .models import Follow, Post, User

@receiver(post_save, sender=Follow)
def update_follow_count_on_save(sender, instance, created, **kwargs):
    if created:
        instance.follower.following_count += 1
        instance.follower.save()
        instance.following.followers_count += 1
        instance.following.save()

@receiver(post_delete, sender=Follow)
def update_follow_counts_on_delete(sender, instance, **kwargs):
    print(f"post_delete signal triggered for Follow: {instance.follower.username} unfollowed {instance.following.username}")

    instance.follower.following_count -= 1
    instance.follower.save()
    instance.following.followers_count -= 1
    instance.following.save()

@receiver(post_save, sender=Post)
def update_post_count_on_save(sender, instance, created, **kwargs):
    if created:
        instance.poster.posts_count += 1
        instance.poster.save()

@receiver(post_delete, sender=Post)
def update_post_count_on_delete(sender, instance, **kwargs):
    instance.poster.posts_count -= 1
    instance.poster.save()

@receiver(m2m_changed, sender = Post.likes.through)
def updated_likes_count(sender, instance, action, **kwargs):
    if action in ("post_add", "post_remove"):
        instance.likes_count = instance.likes.count()
        instance.save()
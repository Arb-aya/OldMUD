from django.contrib import admin

from .models import Character, Item, ItemSettings

# Register your models here.

admin.site.register(Character)
admin.site.register(Item)
admin.site.register(ItemSettings)


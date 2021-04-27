from django.urls import path
from . import views

urlpatterns = [
    path('', views.view_character , name="view_character"),
    path('edit', views.edit_character , name="edit_character"),
    path('inventory', views.manage_inventory, name="manage_inventory"),
    path('update_item', views.update_item, name="update_item"),
    path('view_items', views.view_items, name="view_items"),
    path('buy_item', views.buy_item, name="buy_item")
]

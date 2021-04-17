from django.urls import path
from . import views

urlpatterns = [
    path('', views.view_character , name="view_character"),
    path('edit', views.edit_character , name="edit_character"),
]

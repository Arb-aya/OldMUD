from django.contrib import admin
from django.urls import path
from .views import *

urlpatterns = [
    path('', views.index, name="home_index"),
]

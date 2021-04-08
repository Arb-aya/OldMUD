from django.urls import path
from . import views

urlpatterns = [
    path('', views.character_sheet , name="charcter_sheet"),
]

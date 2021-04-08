from django.shortcuts import render
from django.core.exceptions import ObjectDoesNotExist

from .models import Character

# Create your views here.

def character_sheet(request):
    try:
        character = Character.objects.get(owner__username=request.user.username)
    except ObjectDoesNotExist:
        character = {}

    context = {
            'character': character
            }

    return render(request, "MUD/index.html", context)

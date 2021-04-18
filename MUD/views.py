from django.shortcuts import render, reverse, redirect, HttpResponse
from django.contrib.auth.decorators import login_required
import json

from .models import Character, Item
from .forms import EditCharacterForm, DisplayCharacterForm
from .helpers import validate_character_form, get_character


@login_required
def view_character(request):
    """
    Allows the user to view or edit their character.
    """

    can_edit = False

    character = get_character(request.user.username)
    if not character:
        character = Character(owner=request.user)
        character.save()

    if character.points > 0:
        can_edit = True

    character_form = DisplayCharacterForm(instance=character)
    context = {"character_form": character_form, "can_edit": can_edit}

    return render(request, "MUD/index.html", context)


@login_required
def edit_character(request):
    """
    Allows the user to spend points upgrading their character

    """
    character = get_character(request.user.username)
    if not character:
        return redirect(reverse("view_character"))

    if character.points == 0:
        return redirect(reverse("view_character"))

    character_form = EditCharacterForm(
        request.POST or None, instance=character
    )

    if request.method == "POST":
        if character_form.has_changed():
            if character_form.is_valid():
                if validate_character_form(
                    request.POST, request.user.username
                ):
                    character_form.save()
                    if character.points == 0:
                        return redirect(reverse("view_character"))

    context = {"character_form": character_form, "respec": False}

    return render(request, "MUD/editCharacter.html", context)


@login_required
def manage_inventory(request):
    """
    Allows the user to manage their inventory and items.

    """

    character = get_character(request.user.username)
    if not character:
        return redirect(reverse("view_character"))

    items = character.items.all()

    context = {
        "inventory_size": character.inventory_size,
        "items": list(items.values()),
    }

    return render(request, "MUD/inventory.html", context)


@login_required
def update_item(request):
    """
    Updates an items position. Returns 200 or 404

    """
    if request.method == "POST":
        new_item_data = json.load(request)["item_data"]
        item = Item.objects.get(name=new_item_data['name'])
        if(item):
            item.currentSpaceID = new_item_data['currentSpaceID']
            item.lastSpaceID = new_item_data['lastSpaceID']
            item.save()
            return HttpResponse(200)
        return HttpResponse(404)
    else:
        return redirect(reverse("manage_inventory"))

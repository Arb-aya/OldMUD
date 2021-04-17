from django.shortcuts import render, reverse, redirect
from django.contrib.auth.decorators import login_required

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

    items = character.items.all()

    character_form = DisplayCharacterForm(instance=character)
    context = {
        "character_form": character_form,
        "can_edit": can_edit,
        "inventory_size": character.inventory_size,
        "items": list(items.values()),
    }

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

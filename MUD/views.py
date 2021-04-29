import json

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.serializers import serialize
from django.shortcuts import HttpResponse, redirect, render, reverse

from .forms import DisplayCharacterForm, EditCharacterForm
from .helpers import (get_character, get_items_to_display,
                      validate_character_form)
from .models import Character, Item, ItemSettings


def view_items(request):
    """
    Displays all the items available to the user.
    Filters out items that the user already owns

    """
    character = get_character(request.user.username)
    context = {}
    items = None

    if character:
        items = get_items_to_display(character)
        context["character_gold"] = character.gold
    else:
        items = Item.objects.all()

    context["items"] = items
    return render(request, "Item/index.html", context)


@login_required
def buy_item(request):
    """
    Attempts to buy an item for a character. Succeeds if the character
    has enough gold and doesn't already own the item

    """
    if request.method == "GET":
        return redirect(reverse("view_items"))

    item_name = request.POST["item_name"]
    item = Item.objects.get(name=item_name)
    character = get_character(request.user.username)

    if character.gold >= item.cost:
        obj, created = ItemSettings.objects.get_or_create(
            character=character, item=item
        )
        character.gold -= item.cost
        character.save()

        if not created:
            messages.add_message(
                request, messages.INFO, f"You already own {item_name}"
            )
            return HttpResponse(status=403)
    else:
        messages.add_message(
            request, messages.INFO, f"Not enough gold to buy {item_name}"
        )
        return HttpResponse(status=403)

    character_items = list(character.items.values_list("item__name"))
    items = get_items_to_display(character_items)

    context = {
        "items": items,
        "character_gold": character.gold,
        "character_items": character_items,
    }

    messages.add_message(request, messages.SUCCESS, f"Bought {item_name}")
    return render(request, "Item/index.html", context)


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

    return render(request, "Character/index.html", context)


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

    return render(request, "Character/editCharacter.html", context)


@login_required
def manage_inventory(request):
    """
    Allows the user to manage their inventory and items.

    """

    character = get_character(request.user.username)
    if not character:
        return redirect(reverse("view_character"))

    character_items = list(character.items.all().order_by("item_id"))

    item_ids = [ItemSettings.item_id for ItemSettings in character_items]

    item_data = list(
        Item.objects.filter(pk__in=item_ids)
        .order_by("id")
        .values(
            "name",
            "image",
            "item_type",
            "slot",
            "width",
            "height",
            "rarity",
        )
    )

    for index, item in enumerate(item_data):
        item["lastSpaceIndex"] = character_items[index].lastSpaceIndex
        item["currentSpaceIndex"] = character_items[index].currentSpaceIndex
        item["equipped"] = character_items[index].equipped

    context = {
        "inventory_size": character.inventory_size,
        "items": item_data,
    }

    return render(request, "Character/inventory.html", context)


@login_required
def update_item(request):
    """
    Expects to recieve a list of dictionaries.
    The dictionary needs to have one key of "name" that is the item to update.
    The rest of the key,value pairs are presumed to be settings for the item.
    """
    character = get_character(request.user.username)
    if not character:
        return redirect(reverse("view_character"))

    if request.method == "POST":
        data = json.load(request)["item_data"]

        for item in data:
            itemsettings = ItemSettings.objects.get(
                item__name=item["name"], character_id=character.id
            )

            if itemsettings:
                item.pop("name")
                for attribute, value in item.items():
                    setattr(itemsettings, attribute, value)
                itemsettings.save()
            else:
                return HttpResponse(status=404)

        return HttpResponse(200)
    else:
        return redirect(reverse("manage_inventory"))

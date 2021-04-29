from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q

from .models import Character, Item


def get_items_to_display(character):
    character_items = list(character.items.values_list("item__name"))
    character_items_list = [value for tuple in character_items for value in tuple]
    items_excluding_character_items = Item.objects.filter(~Q(name__in=character_items_list))
    return items_excluding_character_items

def get_character(username):
    """
    Get character from database that belongs to username.
    Returns a blank object if not found

    """
    try:
        character = Character.objects.get(
            owner__username=username
        )
    except ObjectDoesNotExist:
        character = {}

    return character


def validate_character_form(new_data, username):
    """
    Checks that the upgrades to traits falls within the boundary of the old points.
    This is done to rule out the user by passing the frontend validation and
    changing the POST data.

    :param new_data Object: The post data from the edit form
    :param username : Username of the currently logged in user
    """
    fields = Character._meta.get_fields(include_parents=False)
    old_data = get_character(username)

    cumulative_difference = 0

    for field in fields:
        trait_name = field.__str__().split(".")[2]

        if trait_name == "id" or trait_name == "owner":
            continue

        old_value = int(getattr(old_data, trait_name))
        new_value = int(new_data[trait_name])

        # Users cannot claim previously spent points
        if trait_name == "points" and new_value > old_value:
            return False

        cumulative_difference += new_value - old_value

    # Users cannot spend more points than they had
    if cumulative_difference > getattr(old_data,"points"):
        return False

    return True





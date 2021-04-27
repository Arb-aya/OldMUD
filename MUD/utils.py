from django.db import models

class Slot(models.TextChoices):
    HEAD       = ("head", "Head")
    BODY       = ("body", "Body")
    MAIN_HAND  = ("main_hand", "Main Hand")
    OFF_HAND   = ("off_hand", "Off Hand")
    BOTH_HANDS = ("both_hands", "Both Hands")


class ItemType(models.TextChoices):
    WEAPON = ("weapon","Weapon")
    ARMOUR = ("armour","Armour")
    SHIELD = ("shield","Shield")

class ItemRarity(models.TextChoices):
    COMMON = ("common")
    UNUSUAL = ("unusual")
    RARE = ("rare")
    EPIC = ("epic")

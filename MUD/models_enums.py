from enum import Enum


class Slot(Enum):
    HEAD = "head"
    BODY = "body"
    MAIN_HAND = "main_hand"
    OFF_HAND = "off_hand"
    BOTH_HANDS = "both_hands"


class ItemType(Enum):
    WEAPON = "weapon"
    ARMOUR = "armour"
    SHIELD = "shield"

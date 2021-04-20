from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model

from .models_enums import ItemType, Slot
from . import defaultValues


class Item(models.Model):

    name = models.CharField(max_length=254)

    image_url = models.URLField(max_length=1024, null=True, blank=True)

    image = models.ImageField(
        upload_to="items", max_length=1204, null=True, blank=True
    )

    type = models.CharField(default=ItemType.SHIELD, max_length=50)

    slot = models.CharField(default=Slot.OFF_HAND, max_length=50)

    lastSpaceIndex = models.CharField(default="-1", max_length=2)

    currentSpaceIndex = models.CharField(default="-1", max_length=2)

    width = models.IntegerField(default=1, validators=[MinValueValidator(1)])

    height = models.IntegerField(default=1, validators=[MinValueValidator(1)])

    description = models.TextField()

    cost = models.DecimalField(max_digits=4, decimal_places=0)

    def __str__(self):
        return f"{self.id} - {self.name} "


class Character(models.Model):
    """ Represents each chatter's character """

    owner = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)

    inventory_size = models.IntegerField(
        validators=[
            MinValueValidator(defaultValues.MIN_INVENTORY_SIZE),
            MaxValueValidator(defaultValues.MAX_INVENTORY_SIZE),
        ],
        default=defaultValues.DEFAULT_INVENTORY_SIZE,
    )

    # Might want items to be bound to the owner rather than a character?
    items = models.ManyToManyField(Item)

    points = models.IntegerField(
        validators=[
            MinValueValidator(defaultValues.MIN_POINTS_VALUE),
            MaxValueValidator(defaultValues.MAX_POINTS_VALUE),
        ],
        default=defaultValues.DEFAULT_POINTS_VALUE,
    )

    hp = models.IntegerField(
        validators=[
            MinValueValidator(defaultValues.MIN_HP_VALUE),
            MaxValueValidator(defaultValues.MAX_HP_VALUE),
        ],
        default=defaultValues.DEFAULT_HP_VALUE,
    )

    mp = models.IntegerField(
        validators=[
            MinValueValidator(defaultValues.MIN_MP_VALUE),
            MaxValueValidator(defaultValues.MAX_MP_VALUE),
        ],
        default=defaultValues.DEFAULT_MP_VALUE,
    )

    # Controls movement speed
    agility = models.IntegerField(
        validators=[
            MinValueValidator(defaultValues.MIN_AGILITY_VALUE),
            MaxValueValidator(defaultValues.MAX_AGILITY_VALUE),
        ],
        default=defaultValues.DEFAULT_AGILITY_VALUE,
    )

    # Dodge / handling of certain weapons
    dexterity = models.IntegerField(
        validators=[
            MinValueValidator(defaultValues.MIN_DEXTERITY_VALUE),
            MaxValueValidator(defaultValues.MAX_DEXTERITY_VALUE),
        ],
        default=defaultValues.DEFAULT_DEXTERITY_VALUE,
    )

    # Damage / handling of certain weapons
    strength = models.IntegerField(
        validators=[
            MinValueValidator(defaultValues.MIN_STRENGTH_VALUE),
            MaxValueValidator(defaultValues.MAX_STRENGTH_VALUE),
        ],
        default=defaultValues.DEFAULT_STRENGTH_VALUE,
    )

    def __str__(self):
        return f"{self.owner.username}'s character"

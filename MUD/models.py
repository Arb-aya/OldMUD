from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model




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
        return f"hp{self.hp} mp{self.mp} str{self.strength} agi{self.agility} dex{self.dexterity}"


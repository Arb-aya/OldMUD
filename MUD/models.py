from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model


# Create your models here.

user = get_user_model()

class Character(models.Model):
        """ Represents each chatter's character """

        owner = models.ForeignKey(user,on_delete=models.CASCADE)
        hp = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])
        mp = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])

        # Controls movement speed
        agility = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])

        # Dodge / handling of certain weapons
        dexterity = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])

        # Damage / handling of certain weapons
        strength = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])


# class Item(models.Model):
    # pass

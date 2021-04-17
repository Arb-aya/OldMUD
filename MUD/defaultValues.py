from django.conf import settings

"""

Allows users to define min, max and default values for each trait a character can have
in settings.py in the form of:
    MIN_TRAITNAME_VALUE
    MAX_TRAITNAME_VALUE
    DEFAULT_TRAITNAME_VALUE

Also allows the user to provide default fallbacks for all traits by:
    MIN_TRAIT_VALUE
    MAX_TRAIT_VALUE
    DEFAULT_TRAIT_VALUE

"""

# --------------------------------- Points
# -- MIN
try:
    MIN_POINTS_VALUE = settings.MIN_POINTS_VALUE
except:
    MIN_POINTS_VALUE = settings.MIN_TRAIT_VALUE

# -- MAX
try:
    MAX_POINTS_VALUE = settings.MAX_POINTS_VALUE
except:
    MAX_POINTS_VALUE = settings.MAX_TRAIT_VALUE

# -- DEFAULT
try:
    DEFAULT_POINTS_VALUE = settings.DEFAULT_POINTS_VALUE
except:
    DEFAULT_POINTS_VALUE = settings.DEFAULT_TRAIT_VALUE


# ---------------------------------- HP
# -- MIN
try:
    MIN_HP_VALUE = settings.MIN_HP_VALUE
except:
    MIN_HP_VALUE = settings.MIN_TRAIT_VALUE

# -- MAX
try:
    MAX_HP_VALUE = settings.MAX_HP_VALUE
except:
    MAX_HP_VALUE = settings.MAX_TRAIT_VALUE

# -- DEFAULT
try:
    DEFAULT_HP_VALUE = settings.DEFAULT_HP_VALUE
except:
    DEFAULT_HP_VALUE = settings.DEFAULT_TRAIT_VALUE

# ---------------------------------- MP
# -- MIN
try:
    MIN_MP_VALUE = settings.MIN_MP_VALUE
except:
    MIN_MP_VALUE = settings.MIN_TRAIT_VALUE

# -- MAX
try:
    MAX_MP_VALUE = settings.MAX_MP_VALUE
except:
    MAX_MP_VALUE = settings.MAX_TRAIT_VALUE

# -- DEFAULT
try:
    DEFAULT_MP_VALUE = settings.DEFAULT_MP_VALUE
except:
    DEFAULT_MP_VALUE = settings.DEFAULT_TRAIT_VALUE

# --------------------------------- Strength
# -- MIN
try:
    MIN_STRENGTH_VALUE = settings.MIN_STRENGTH_VALUE
except:
    MIN_STRENGTH_VALUE = settings.MIN_TRAIT_VALUE

# -- MAX
try:
    MAX_STRENGTH_VALUE = settings.MAX_STRENGTH_VALUE
except:
    MAX_STRENGTH_VALUE = settings.MAX_TRAIT_VALUE

# -- DEFAULT
try:
    DEFAULT_STRENGTH_VALUE = settings.DEFAULT_STRENGTH_VALUE
except:
    DEFAULT_STRENGTH_VALUE = settings.DEFAULT_TRAIT_VALUE

# --------------------------------- Agility
# -- MIN
try:
    MIN_AGILITY_VALUE = settings.MIN_AGILITY_VALUE
except:
    MIN_AGILITY_VALUE = settings.MIN_TRAIT_VALUE

# -- MAX
try:
    MAX_AGILITY_VALUE = settings.MAX_AGILITY_VALUE
except:
    MAX_AGILITY_VALUE = settings.MAX_TRAIT_VALUE

# -- DEFAULT
try:
    DEFAULT_AGILITY_VALUE = settings.DEFAULT_AGILITY_VALUE
except:
    DEFAULT_AGILITY_VALUE = settings.DEFAULT_TRAIT_VALUE

# --------------------------------- Dexterity
# -- MIN
try:
    MIN_DEXTERITY_VALUE = settings.MIN_DEXTERITY_VALUE
except:
    MIN_DEXTERITY_VALUE = settings.MIN_TRAIT_VALUE

# -- MAX
try:
    MAX_DEXTERITY_VALUE = settings.MAX_DEXTERITY_VALUE
except:
    MAX_DEXTERITY_VALUE = settings.MAX_TRAIT_VALUE

# -- DEFAULT
try:
    DEFAULT_DEXTERITY_VALUE = settings.DEFAULT_DEXTERITY_VALUE
except:
    DEFAULT_DEXTERITY_VALUE = settings.DEFAULT_TRAIT_VALUE


# --------------------------------- INVENTORY
# -- MIN
try:
    MIN_INVENTORY_SIZE = settings.MIN_INVENTORY_SIZE
except:
    MIN_INVENTORY_SIZE = settings.MIN_TRAIT_VALUE

# -- MAX
try:
     MAX_INVENTORY_SIZE = settings.MAX_INVENTORY_SIZE
except:
    MAX_INVENTORY_SIZE = settings.MAX_TRAIT_VALUE

# -- DEFAULT
try:
    DEFAULT_INVENTORY_SIZE = settings.DEFAULT_INVENTORY_SIZE
except:
    DEFAULT_INVENTORY_SIZE = settings.DEFAULT_TRAIT_VALUE





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


class SettingType:
    default = "DEFAULT"
    minimum = "MIN"
    maximum = "MAX"


game_settings_defaults_mapper = {
    SettingType.default: settings.DEFAULT_TRAIT_VALUE,
    SettingType.maximum: settings.MAX_TRAIT_VALUE,
    SettingType.minimum: settings.MIN_TRAIT_VALUE,
}


def get_game_setting(value, setting_type):
    return (
        getattr(settings, value, None)
        or game_settings_defaults_mapper[setting_type]
    )


DEFAULT_GOLD_VALUE = get_game_setting(
    "DEFAULT_GOLD_VALUE", SettingType.default
)
MIN_GOLD_VALUE = get_game_setting("MIN_GOLD_VALUE", SettingType.minimum)
MAX_GOLD_VALUE = get_game_setting("MAX_GOLD_VALUE", SettingType.maximum)

DEFAULT_POINTS_VALUE = get_game_setting(
    "DEFAULT_POINTS_VALUE", SettingType.default
)
MIN_POINTS_VALUE = get_game_setting("MIN_POINTS_VALUE", SettingType.minimum)
MAX_POINTS_VALUE = get_game_setting("MAX_POINTS_VALUE", SettingType.maximum)

DEFAULT_HP_VALUE = get_game_setting("DEFAULT_HP_VALUE", SettingType.default)
MIN_HP_VALUE = get_game_setting("MIN_HP_VALUE", SettingType.minimum)
MAX_HP_VALUE = get_game_setting("MAX_HP_VALUE", SettingType.maximum)


DEFAULT_MP_VALUE = get_game_setting("DEFAULT_MP_VALUE", SettingType.default)
MIN_MP_VALUE = get_game_setting("MIN_MP_VALUE", SettingType.minimum)
MAX_MP_VALUE = get_game_setting("MAX_MP_VALUE", SettingType.maximum)


DEFAULT_STRENGTH_VALUE = get_game_setting(
    "DEFAULT_STRENGTH_VALUE", SettingType.default
)
MIN_STRENGTH_VALUE = get_game_setting(
    "MIN_STRENGTH_VALUE", SettingType.minimum
)
MAX_STRENGTH_VALUE = get_game_setting(
    "MAX_STRENGTH_VALUE", SettingType.maximum
)

DEFAULT_AGILITY_VALUE = get_game_setting(
    "DEFAULT_AGILITY_VALUE", SettingType.default
)
MIN_AGILITY_VALUE = get_game_setting("MIN_AGILITY_VALUE", SettingType.minimum)
MAX_AGILITY_VALUE = get_game_setting("MAX_AGILITY_VALUE", SettingType.maximum)

DEFAULT_DEXTERITY_VALUE = get_game_setting(
    "DEFAULT_DEXTERITY_VALUE", SettingType.default
)
MIN_DEXTERITY_VALUE = get_game_setting(
    "MIN_DEXTERITY_VALUE", SettingType.minimum
)
MAX_DEXTERITY_VALUE = get_game_setting(
    "MAX_DEXTERITY_VALUE", SettingType.maximum
)

DEFAULT_INVENTORY_SIZE = get_game_setting(
    "DEFAULT_INVENTORY_SIZE", SettingType.default
)
MIN_INVENTORY_SIZE = get_game_setting(
    "MIN_INVENTORY_SIZE", SettingType.minimum
)
MAX_INVENTORY_SIZE = get_game_setting(
    "MAX_INVENTORY_SIZE", SettingType.maximum
)

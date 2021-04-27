from django.forms import ModelForm
from django import forms

from crispy_forms.helper import FormHelper

from .models import Character
from . import defaultValues


class DisplayCharacterForm(ModelForm):
    """
    Form used to display character information to user

    """
    class Meta:
        model = Character
        exclude = ["id", "owner"]
        widgets = {
            "points": forms.TextInput,
            "gold": forms.TextInput,
            "hp": forms.TextInput,
            "mp": forms.TextInput,
            "strength": forms.TextInput,
            "agility": forms.TextInput,
            "dexterity": forms.TextInput,
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.helper = FormHelper(self)
        self.helper.form_show_labels = False

        self.fields["gold"].widget.attrs['readonly']=True
        self.fields["gold"].widget.attrs['aria-labelledby']="GoldTitle"

        self.fields["points"].widget.attrs['readonly']=True
        self.fields["points"].widget.attrs['aria-labelledby']="PointsTitle"

        self.fields["hp"].widget.attrs['readonly']=True
        self.fields["hp"].widget.attrs['aria-labelledby']="HPTitle"

        self.fields["mp"].widget.attrs['readonly']=True
        self.fields["mp"].widget.attrs['aria-labelledby']="HPTitle"

        self.fields["strength"].widget.attrs['readonly']=True
        self.fields["strength"].widget.attrs['aria-labelledby']="StrengthTitle"

        self.fields["agility"].widget.attrs['readonly']=True
        self.fields["agility"].widget.attrs['aria-labelledby']="AgilityTitle"

        self.fields["dexterity"].widget.attrs['readonly']=True
        self.fields["dexterity"].widget.attrs['aria-labelledby']="DexterityTitle"


class EditCharacterForm(ModelForm):
    """
    Form used to allow user to spend points upgrading their character
    """
    class Meta:
        model = Character
        exclude = ["id", "owner"]
        widgets = {
            "points": forms.TextInput,
            "hp": forms.TextInput,
            "mp": forms.TextInput,
            "strength": forms.TextInput,
            "agility": forms.TextInput,
            "dexterity": forms.TextInput,
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.form_show_labels = False

        self.fields["points"].widget.attrs['readonly']=True
        self.fields["points"].widget.attrs['aria-labelledby']="PointsTitle"

        self.fields["hp"].widget.attrs["data-min"] = defaultValues.MIN_HP_VALUE
        self.fields["hp"].widget.attrs["data-max"] = defaultValues.MAX_HP_VALUE
        self.fields["hp"].widget.attrs['aria-labelledby']="HPTitle"

        self.fields["mp"].widget.attrs["data-min"] = defaultValues.MIN_MP_VALUE
        self.fields["mp"].widget.attrs["data-max"] = defaultValues.MAX_MP_VALUE
        self.fields["mp"].widget.attrs['aria-labelledby']="MPTitle"

        self.fields["strength"].widget.attrs[
            "data-min"
        ] = defaultValues.MIN_STRENGTH_VALUE
        self.fields["strength"].widget.attrs[
            "data-max"
        ] = defaultValues.MAX_STRENGTH_VALUE
        self.fields["strength"].widget.attrs['aria-labelledby']="StrengthTitle"

        self.fields["agility"].widget.attrs[
            "data-min"
        ] = defaultValues.MIN_AGILITY_VALUE
        self.fields["agility"].widget.attrs[
            "data-max"
        ] = defaultValues.MAX_AGILITY_VALUE
        self.fields["agility"].widget.attrs['aria-labelledby']="AgilityTitle"

        self.fields["dexterity"].widget.attrs[
            "data-min"
        ] = defaultValues.MIN_DEXTERITY_VALUE
        self.fields["dexterity"].widget.attrs[
            "data-max"
        ] = defaultValues.MAX_DEXTERITY_VALUE
        self.fields["dexterity"].widget.attrs['aria-labelledby']="DexterityTitle"

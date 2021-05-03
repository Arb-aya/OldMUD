from django.shortcuts import render, redirect ,reverse
from django.contrib import messages

from .forms import OrderForm


def checkout(request):
    gold = request.session.get('gold_bundle',{})

    if not gold:
        messages.add_message(request, messages.ERROR, "You haven't chosen anything to buy yet")
        return redirect(reverse('view_shop'))

    order_form = OrderForm()
    context = {
            'order_form':order_form,
            'bundle': gold
            }
    del request.session['gold_bundle']

    return render(request,'checkout/checkout.html',context)


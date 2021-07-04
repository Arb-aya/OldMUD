from django.shortcuts import render, redirect ,reverse
from django.contrib import messages
from django.conf import settings

from .forms import OrderForm

import stripe


def checkout(request):
    stripe_public_key = settings.STRIPE_PUBLIC_KEY
    stripe_secret_key = settings.STRIPE_SECRET_KEY

    name = request.session.get('bundle_name',{})
    price = request.session.get('bundle_price',{})

    if not name and price:
        messages.add_message(request, messages.ERROR, "You haven't chosen anything to buy yet")
        return redirect(reverse('view_shop'))

    stripe.api_key = stripe_secret_key
    intent = stripe.PaymentIntent.create(
        amount=round(price*100),
        currency=settings.STRIPE_CURRENCY,
    )

    if not stripe_public_key:
        messages.warning(request, "Stripe public key has not been set")

    order_form = OrderForm()
    context = {
            'order_form':order_form,
            'bundle_name': name,
            'bundle_price': price,
            'stripe_public_key':stripe_public_key,
            'client_secret': intent.client_secret,
            }

    return render(request,'checkout/checkout.html',context)


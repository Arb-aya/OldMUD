from django.shortcuts import render, redirect ,reverse, get_object_or_404
from django.contrib import messages
from django.conf import settings

from MUD.helpers import get_character
from .forms import OrderForm
from .models import Order


import stripe


def checkout(request):
    stripe_public_key = settings.STRIPE_PUBLIC_KEY
    stripe_secret_key = settings.STRIPE_SECRET_KEY
    name = request.session.get('bundle_name',{})
    price = request.session.get('bundle_price',{})
    stripe.api_key = stripe_secret_key
    intent = stripe.PaymentIntent.create(
            amount=round(price*100),
            currency=settings.STRIPE_CURRENCY,
        )

    if request.method == "POST":
        form_data = {
            'user': request.user,
            'full_name': request.POST['full_name'],
            'email': request.POST['email'],
            'phone_number': request.POST['phone_number'],
            'country': request.POST['country'],
            'postcode': request.POST['postcode'],
            'town_or_city': request.POST['town_or_city'],
            'street_address1': request.POST['street_address1'],
            'street_address2': request.POST['street_address2'],
            'county': request.POST['county'],
        }

        order_form = OrderForm(form_data)
        if order_form.is_valid():
            order = order_form.save(commit=False)
            order.user_id = request.user.id
            order.total = request.POST['total']
            order.save()

            character = get_character(request.user.username)

            if name == "large":
                character.gold += 100
            if name == "medium":
                character.gold += 30
            if name == "small":
                character.gold += 10

            character.save()


            return redirect(reverse('checkout_success', args=[order.order_number]))
        else:
            messages.error(request, "There was an error with processing your order")
            context = {
                'order_form':order_form,
                'bundle_name': name,
                'bundle_price': price,
                'stripe_public_key':stripe_public_key,
                'client_secret': intent.client_secret,
            }

        return render(request,'checkout/checkout.html',context)

    else:
        if not name and price:
            messages.add_message(request, messages.ERROR, "You haven't chosen anything to buy yet")
            return redirect(reverse('view_shop'))

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

def checkout_success(request, order_number):
    order = get_object_or_404(Order,order_number=order_number)
    messages.success(request, f'Order successfully processed! \
                        Your order number is {order_number}')

    context = {
        'order': order,
        'bundle_name': request.session['bundle_name'],
    }

    if 'bundle_name' in request.session:
        del request.session['bundle_name']

    if 'bundle_price' in request.session:
        del request.session['bundle_price']

    return render(request, 'checkout/checkout_success.html',context)

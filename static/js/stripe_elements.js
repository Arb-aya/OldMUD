/**
 * https://stripe.com/docs/payment/accept-a-payment
 * https://stripe.com/docs/stripe-js
 * JS modified from  https://github.com/Code-Institute-Solutions/boutique_ado_v1/
 *      Changed JQuery to vanilla JS.
 */

const stripe_public_key = document.getElementById('id_stripe_public_key').textContent.slice(1,-1);
const client_secret = document.getElementById('id_client_secret').textContent.slice(1,-1);
let stripe = Stripe(stripe_public_key);

var style = {
    base:{
        color: '#000000',
        fontSize: '16px',
        '::placeholder':{
            color: '#696969'
        }
    },
    invalid:{
        color: '#dc3545',
        iconColor: '#dc3545'
    }

};
let elements = stripe.elements();
let card = elements.create('card', {style: style});
card.mount('#card-element');

card.addEventListener('change',e => {
    const error_div = document.getElementById('card-errors');

    if(e.error){
        const html = `<span class="icon" role="alert">
                        <i class="fas fa-times"></i>
                        </span>
                        <span class="text-white">${e.error.message}</span>
                    `
        error_div.innerHTML = html;
    }
    else{
        error_div.textContent = '';
    }
});

let form = document.getElementById('payment_form');

form.addEventListener('submit', ev => {
    ev.preventDefault();
    card.update({ 'disabled': true});
    document.getElementById('submit-button').setAttribute('disabled',true);

    stripe.confirmCardPayment(client_secret, {
        payment_method: {
            card: card,
        },
    }).then(function(result) {
        if (result.error) {
            var error_div = document.getElementById('card-errors');
            var html = `
                <span class="icon" role="alert">
                <i class="fas fa-times"></i>
                </span>
                <span>${result.error.message}</span>`;
            error_div.innerHTML = html;
            card.update({ 'disabled': true});
            document.getElementById('submit-button').setAttribute('disabled',true);
        } else {
            if (result.paymentIntent.status === 'succeeded') {
                form.submit();
            }
        }
    });
});
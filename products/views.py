from django.shortcuts import render, get_object_or_404
from PersonalWebsite import settings
from .models import Product
# Create your views here.

def product_index(request):
    products = Product.objects.all()
    context = {
            'products': products,
            }

    return render(request, "products/index.html", context)

def product_detail(request,product_id):
    product = get_object_or_404(Product, pk=product_id)
    context = {
            'product': product,
            }

    return render(request, "products/product_detail.html", context)

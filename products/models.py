from django.db import models

# Create your models here.

class Product(models.Model):
    product_name = models.CharField(max_length=60)
    product_image = models.ImageField(upload_to='products', max_length=1024, null=True, blank=True)
    price = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)


    def __str__(self):
        return self.product_name

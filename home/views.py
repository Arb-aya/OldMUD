from django.shortcuts import render

from .helpers import get_github_repos

# Create your views here.




def index(request):
    repos = get_github_repos()

    context = {
            'repos':repos,
            }
    return render(request, "home/index.html", context)

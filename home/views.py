from django.shortcuts import render

from .helpers import get_github_repos


def index(request):
    """
    Return a view for the homepage. Gather information on
    repos to display

    """
    repos = get_github_repos()

    context = {
        "repos": repos,
    }
    return render(request, "home/index.html", context)

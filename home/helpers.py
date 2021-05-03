import requests
from itertools import islice

def chunk(it, size):
    it = iter(it)
    return iter(lambda: tuple(islice(it, size)), ())

def get_github_repos():
    repos = requests.get('https://api.github.com/users/Arb-aya/repos').json()
    repos_to_display = list(chunk(repos,3))
    return repos_to_display

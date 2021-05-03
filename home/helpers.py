import requests
from itertools import islice

def chunk(it, size):
    """
    Taken from https://stackoverflow.com/questions/312443/how-do-you-split-a-list-into-evenly-sized-chunks

    :param it List: The list to split into chunks
    :param size Integer: Size of each chunk
    """
    it = iter(it)
    return iter(lambda: tuple(islice(it, size)), ())

def get_github_repos():
    """
    Gets the json data to display information about my github repos

    """
    repos = requests.get('https://api.github.com/users/Arb-aya/repos').json()
    repos_to_display = list(chunk(repos,3))
    return repos_to_display

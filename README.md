# Arbaya's Personal Site 

This is my personal site. I want to use this site to show off the projects I have been working on and to eventually be able to post blog posts to it.

The most important aspect of the site is the integration with my twitch channel users.
Users can spend time in my chat and earn points and gold (issued to them via a bot). They can then use their twitch account to log in to the site to use their points to upgrade traits of their character; to spend gold on new items.

## UX
 
### User stories 

As the site owner I should be able to: 
	* Manage all aspects of the twitch game including:
		* C.R.U.D functionality for items
		* Create new traits for characters
		* C.R.U.D functionality for characters

As a general site user I should be able to:
	* View the projects that the site owner has worked on
	* Login with my twitch account to:
		* Upgrade my character
		* Buy new items for my character

With this project I wanted to make the colourscheme as accesible as possible. So I selected the following colour pallete using the following websites:
https://davidmathlogic.com/colorblind/#%23000000-%23E69F00-%2356B4E9-%23009E73-%23F0E442-%230072B2-%23D55E00-%23CC79A7

[Colour pallete used](https://i.imgur.com/ENyCJAF.png)

I also tested the colour pallete [using this website](https://coolors.co/0072b2-d55e00-000000-ffffff-e69f00) and [this website](color.review) to make sure my colour combinations kept an appropriate contrast when viewed in different types of colour blindness.


## Features

Users can manage their the items that they have bought via the use of a HTML 5 canvas. This allows users to use drag and drop / double clicks to equip unequip their items. This was by far the most complex feature created is split across 4 main files:

Item.js -> This file is resonsible for creating a Konva image object and returning a wrapper object that manages the item position in the inventory.
Character_stage.js -> This shows the user items that are equipped, and fires a number of events to signal the user wants to equip/unequip items.
Inventory_stage.js -> This shows the user items that are not equipped. Users can re-arrange items in their inventory and this is saved in the database. This also fires events to indicate that the user wants to equip / unequip items. This is also redrawn when the user's viewport size changes (horizontally -> vertically) and repositions items appropriately.
inventory.js -> Ties all of the above files together and reacts the the various events fired by them.

I also used the browsers intersection observer API for two features on the site. Firstly, it triggers an entrance animation for homepage content when the user scrolls to that section for the first time. Secondly, the opacity of loaded content changes depending on how far it is from the users viewport (further away from the centre, more transparent). This can be viewed in scrolling.js


Users can buy and sell items in the shop. These options are only presented when appropriate (buy for when the user does not have the item; sell for when the user does have the item).

### Features Left to Implement
- Checkout system using stripe allowing users to buy more gold
- Blog post system. Allows me to post and render blogs from markdown files.

### Bugs
Occasionally when logging in with a twich account the user is presented with a small black and white box, which asks the user to clic
k OK. After clicking OK, the user is told that the login failed. However, if the user tries to log in again afterwards it succeeds. I'm not sure of the cause of this bug.


## Technologies Used


* HTML 5 - Used to provide structure to each page of the site
* CSS  - Used to format the HTML of each page.
* Javascript - Used for many aspects of the site; to provide improved user experience.
* [Python](https://www.python.org/) - Used for the backend of the site.
* [django](https://www.djangoproject.com/) - Used as the database. Also used their cloud service to host the database for the deployed site.
* [Konva.js](konvajs.org) - Javascript 2D canvas library. Used for user inventory management.
* [SASS]() - Used for writing the css for the site. The sass files have been included in the repo.
* [Heroku](https://www.heroku.com/) - Used to host the deployed site.
* [Amazon aws](https://aws.amazon.com/) - Used to host the static files for the site
* [Firefox Dev tools](https://developer.mozilla.org/en-US/docs/Tools) - Used during development to test the responsive design. 
* [Neovim](https://neovim.io/) - Code editor used to develop this project. A number of plugins were used with it and the config can be viewed [here](https://github.com/CDHayden/dotfiles/blob/master/init.vim)
* [Sizzy](sizzy.co) - Browser used to test my site across many different viewports/devices
* [Git](https://git-scm.com/) - Local version control
* [Github](https://github.com/) - Used to host the online repository for this site.j
* [Bootstrap](https://getbootstrap.com/) - Used to builda responsive website.
* [color.review](https://color.review/) - To pick colour pallete and check the contrast is compliant with standards.
* [Fontawesome](https://fontawesome.com/) - Icons used on site.
* [Autoprefixer](https://autoprefixer.github.io/) - Used to get browser specific prefixs for my css.
* [Css gradient generator](https://cssgradient.io/) - Used to generate the gradients used on the site
* [Box Shadow Generator](https://cssgenerator.org/box-shadow-css-generator.html) - Used to generate drop shadows for site.
* [Django secret key generator]( https://django-secret-key-generator.netlify.app/) - Used to generate secret keys for Django
* [Can I use](https://caniuse.com/) - Used to check browser support for various Javascript functionalities


## Testing

Manual testing was utilized from the beginning with this project (too many console.logs / prints). I also tested it in multiple browsers and on multiple devices to ensure that it works on as many options as possible.

## Deployment

To run code locally. You should fork this repo. You need to make sure you have a "SECRET_KEY" environment variable set to an appropriate secret key value for Django to use.

You should also have a "DEVELOPMENT" variable set to some value if you wish to run the site in development/debug mode.

The deployed heroku version makes use of the "USE_AWS" and "DEVELOPMENT" environment variables to dictate where the static files are sourced from and whether to run the server in debug mode or not, respectively.


## Credits

### Content
- The text for section Y was copied from the [Wikipedia article Z](https://en.wikipedia.org/wiki/Z)

### Acknowledgements

As always my mentor Reuben Ferrante, who has been a big help throughout the entire course.

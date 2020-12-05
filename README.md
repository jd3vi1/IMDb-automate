# IMDb Automated Recommendation Scraper

This is an automated web scraper written in node, using puppeteer.

![demo](https://github.com/j-devil99/IMDb-automate/blob/master/demo/demo.gif?raw=true)

## Features

* [x] Logs into the user's account, searches and rates a given movie/show.
  
* [x] Adds all similar movies to watchlist (skips if they're already added/rated).
  
* [x] Scrapes data from all the similar movies.

* [x] Sharing a movie quote from the recently watched movie to Twitter.
  
* [x] Stores the scraped data in JSON format.
  
* [x] Also creates and opens an HTML page, showing what movies to watch next, sorted by IMDb rating.
  
* [ ] Stylize the HTML page using CSS or by using a templating language like handlebars.
  
* [X] Convert to PDF.
  
* [ ] Showing where you can watch the recommended movies. (Decider.com)

* [X] Email the recommendations to the user.

## Usage

* Clone the repository.

* Open the base directory of the repository.

* Run the following command in terminal:

  ```node
  npm install
  ```

* Create a credentials.JSON in the activity folder file with your IMDb account email and password as follows:
  
  ```json
    {
        "email": "YOUR_EMAIL_ID_HERE",
        "password": "YOUR_PASSWORD_HERE",
        "password2": "TWITTER_PASSWORD_HERE",
        "adminEmail": "MAILER_ID_HERE",
        "adminPassword": "MAILER_PASSWORD_HERE"
    }
  ```

  Note: IMDb account and Twitter account should have same email id, otherwise you'll have to make changes in the code.

* Open a terminal in the activity folder and run the following command:

  ```node
  node recommend.js credentials.json "MOVIE_TITLE_HERE" YOUR_RATING_HERE
  
  ```

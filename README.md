# IMDb Automated Recommendation Scraper

This is an automated web scraper written in node, using puppeteer.

## Features

* [x] Logs into the user's account, searches and rates a given movie/show.
  
* [x] Adds all similar movies to watchlist (skips if they're already added/rated).
  
* [x] Scrapes data from all the similar movies.

* [x] Stores the scraped data in JSON format.
  
* [x] Also creates and opens an HTML page, showing what movies to watch next, sorted by IMDb rating.
  
* [ ] Stylize the HTML page using CSS or by using a templating language like handlebars.
  
* [ ] Convert to PDF.
  
* [x] Sharing a movie quote from the recently watched movie to Twitter.
  
* [ ] Showing where you can watch the recommended movies. (Decider.com)

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
        "password2": "TWITTER_PASSWORD_HERE"
    }
  ```

  Note: IMDb account and Twitter account should have same email id, otherwise you'll have to make changes in the code.

* Open a terminal in the activity folder and run the following command:

  ```node
  node recommend.js credentials.json "MOVIE_TITLE_HERE" YOUR_RATING_HERE
  
  ```

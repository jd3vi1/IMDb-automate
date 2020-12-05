const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const credsFile = process.argv[2];
const movie = process.argv[3];
const rating = process.argv[4];
let scrapedData = [];
let currentPath = process.cwd();
let finalHtml;

const css =
    `
        <style>
	    .heading {
	    	text-align: center;
	    	margin: 20px;
	    }

	    div {
	    	padding: 20px;
	    	border-radius: 10px;
	    }

	    div:nth-child(2n) {
	    	background-color: rgb(231, 206, 168);
	    }

	    div:nth-child(2n + 1) {
	    	background-color: #A8C1E7;
	    }

	    div h3 {
	    	font-size: 1.1rem;
	    }

	    div p {
	    	font-size: 1rem;
	    }
        </style>
    `;

// main function
(async function () {
	// retrieve credentials
	let data = await fs.promises.readFile(credsFile, "utf-8");
	let creds = JSON.parse(data);
	email = creds.email;
	password = creds.password;
	password2 = creds.password2;

	// retrieve admin credentials
	adminEmail = creds.adminEmail;
	adminPassword = creds.adminPassword;

	// launch browser
	let browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
		args: ["--start-maximized", "--disable-notifications"],
	});

	let numberOfPages = await browser.pages();
	let tab = numberOfPages[0];

	// goto IMDb Homepage
	await tab.goto("https://www.imdb.com/", {
		waitUntil: "networkidle2",
	});

	// login
	await login(tab, email, password);

	// search
	await search(tab);

	// result page
	if (await inWatchlist(tab)) {
		console.log("Now you've watched this!");
		await tab.click("#title-overview-widget div.ribbonize > div");
	}

	// give rating
	await setRating(tab);

	// add recommendations to watchlist
	await addToWatchlist(tab);

	// tweet a quote
	await tweet(tab, browser, email, password2);

	// sort scraped data according to rating
	scrapedData.sort((a, b) => {
		return a.rating > b.rating ? -1 : 1;
	});

	// write the recommendations to a file, store it as JSON
	await fs.promises.writeFile(
		"watchNext.JSON",
		JSON.stringify(scrapedData, null, 4)
	);

	// create HTML and open
	await createHTML(tab, browser);

	// launch browser 2
	let browser2 = await puppeteer.launch({
		headless: true,
		defaultViewport: null,
		args: ["--start-maximized", "--disable-notifications"],
	});
	let headlessPages = await browser2.pages();
	let headlessTab = headlessPages[0];
	
	// create pdf
	await headlessTab.setContent(finalHtml);
	await headlessTab.pdf({path: './watchNext.pdf'});


	// mail pdf to user
	await mailPDF(email, adminEmail, adminPassword, movie);
})();

// login function
async function login(tab, email, password) {
	await tab.waitForSelector("#imdbHeader div.navbar__user");
	await navigationHelper(tab, "#imdbHeader div.navbar__user");

	await tab.waitForSelector(
		"#signin-options > div > div:nth-child(2) > a:nth-child(1)"
	);
	await navigationHelper(
		tab,
		"#signin-options > div > div:nth-child(2) > a:nth-child(1)"
	);

	await tab.waitForSelector('input[type="email"]');
	await tab.type('input[type="email"]', email, { delay: 100 });

	await tab.waitForSelector('input[type="password"]');
	await tab.type('input[type="password"]', password, { delay: 100 });

	await tab.waitForSelector('input[type="submit"]');
	await navigationHelper(tab, 'input[type="submit"]');
}

// search title function
async function search(tab) {
	await tab.waitForSelector(
		"#nav-search-form > div.search-category-selector > div > label > div"
	);
	await tab.click(
		"#nav-search-form > div.search-category-selector > div > label > div"
	);

	await tab.waitForSelector(
		'#navbar-search-category-select-contents > ul > a[aria-label="Titles"]'
	);
	await tab.click(
		'#navbar-search-category-select-contents > ul > a[aria-label="Titles"]'
	);

	await tab.waitForSelector("#suggestion-search");
	await tab.type("#suggestion-search", movie);
	// await tab.keyboard.press("Enter");

	await tab.waitForSelector("#react-autowhatever-1--item-0 > a");
	await navigationHelper(tab, "#react-autowhatever-1--item-0 > a");
}

// check if title in Watchlist
async function inWatchlist(tab) {
	console.log("Checking...");
	await tab.waitForSelector("#title-overview-widget div.ribbonize > div");
	return await tab.evaluate(() => {
		return document
			.querySelector("#title-overview-widget div.ribbonize > div")
			.classList.contains("inWL");
	});
}

// function to give the rating
async function setRating(tab) {
	await tab.waitForSelector("#star-rating-widget > div > button");
	await tab.click("#star-rating-widget > div > button");

	await tab.waitForSelector(
		"#star-rating-widget > div > div > span:nth-child(1) > span"
	);
	await tab.hover(
		`#star-rating-widget > div > div > span:nth-child(1) > span > a:nth-child(${rating})`,
		{ delay: 500 }
	);
	await tab.click(
		`#star-rating-widget > div > div > span:nth-child(1) > span > a:nth-child(${rating})`,
		{ delay: 500 }
	);
}

// function to scrape data
async function scraper(tab, i) {
	let title = await tab.evaluate((i) => {
		return document.querySelector(
			`#title_recs > div.rec_overviews > div:nth-child(${i}) > div.rec_details > div > div.rec-jaw-upper > div.rec-title > a > b`
		).innerText;
	}, i);
	let rating = await tab.evaluate((i) => {
		return document.querySelector(
			`#title_recs > div.rec_overviews > div:nth-child(${i}) > div.rec_details > div > div.rec-jaw-upper > div.rec-rating > div > span:nth-child(4) > span:first-child`
		).innerText;
	}, i);
	let genre = await tab.evaluate((i) => {
		return document.querySelector(
			`#title_recs > div.rec_overviews > div:nth-child(${i}) > div.rec_details > div > div.rec-jaw-upper > div.rec-cert-genre.rec-elipsis`
		).innerText;
	}, i);
	let synopsis = await tab.evaluate((i) => {
		return document.querySelector(
			`#title_recs > div.rec_overviews > div:nth-child(${i}) > div.rec_details > div > div.rec-jaw-upper > div.rec-rating > div.rec-outline > p`
		).innerText;
	}, i);
	return {
		title,
		rating,
		genre,
		synopsis,
	};
}

// function to add all recommendations to watchlist
async function addToWatchlist(tab) {
	for (let i = 1; i <= 12; i++) {
		if (i === 7) {
			await delay(1000);
		}
		await tab.waitForSelector(
			`#title_recs > div.rec_overviews > div:nth-child(${i}) > div.rec_actions > div.rec_action_divider > div > span > a > a`
		);

		// scrape movie data
		let scrapeObject = await scraper(tab, i);
		console.log("After scraper");

		scrapedData.push(scrapeObject);

		// checks if already in watchlist
		let inWL = await tab.evaluate((i) => {
			console.log(i);
			return document
				.querySelector(
					`#title_recs > div.rec_overviews > div:nth-child(${i}) > div.rec_actions > div.rec_action_divider > div > span > a > a`
				)
				.classList.contains("btn2_glyph_on");
		}, i);

		// checks if already rated the movie before
		let ratedBefore = await tab.evaluate((i) => {
			return document
				.querySelector(
					`#title_recs > div.rec_overviews > div:nth-child(${i}) > div.rec_details > div > div.rec-jaw-upper > div.rec-rating > div > span:nth-child(4) `
				)
				.classList.contains("rating-your");
		}, i);

		// click on next title
		if (inWL || ratedBefore) {
			await tab.waitForSelector(
				`#title_recs > div.rec_overviews > div:nth-child(${i}) > div.rec_actions > div.rec_next_btn > span > a`
			);
			await tab.click(
				`#title_recs > div.rec_overviews > div:nth-child(${i}) > div.rec_actions > div.rec_next_btn > span > a`,
				{ delay: 500 }
			);
		} else {
			// add to watchlist
			await tab.click(
				`#title_recs > div.rec_overviews > div:nth-child(${i}) > div.rec_actions > div.rec_action_divider > div > span > a > a`,
				{ delay: 500 }
			);
		}
		console.log("After clicking next");
	}
	console.table(scrapedData);
}

// funciton to post a tweet
async function tweet(tab, browser, email, password2) {
	// goto quotes page
	await tab.waitForSelector(
		"#quicklinksMainSection > span.show_more.quicklink"
	);
	await tab.click("#quicklinksMainSection > span.show_more.quicklink", {
		delay: 500,
	});
	delay(1000);
	await tab.waitForSelector(
		"#full_subnav > div:nth-child(4) > div > div:nth-child(5) > a"
	);
	await navigationHelper(
		tab,
		"#full_subnav > div:nth-child(4) > div > div:nth-child(5) > a"
	);

	// generate a random number between 1-10
	let randomNumber = Math.round(Math.random() * 10);

	// select a quote
	await tab.waitForSelector(
		`.list > div:nth-child(${randomNumber}) > div.sodatext`
	);
	let quote = await tab.evaluate((randomNumber) => {
		return document.querySelector(
			`.list > div:nth-child(${randomNumber}) > div.sodatext`
		).innerText;
	}, randomNumber);
	quote += `#${movie.split(" ").join("")} #moviequotes #${rating}on10`;

	// click on share
	await tab.waitForSelector(
		`.list > div:nth-child(${randomNumber}) > div.did-you-know-actions > span.linksoda > a`
	);
	await tab.click(
		`.list > div:nth-child(${randomNumber}) > div.did-you-know-actions > span.linksoda > a`
	);

	await tab.waitForSelector(
		`.list > div:nth-child(${randomNumber}) > div.did-you-know-actions > div.sharesoda_pre > a:nth-child(3)`
	);
	// promise for a new window
	const newPagePromise = new Promise((x) =>
		browser.once("targetcreated", (target) => x(target.page()))
	);
	await tab.click(
		`.list > div:nth-child(${randomNumber}) > div.did-you-know-actions > div.sharesoda_pre > a:nth-child(3)`
	);

	// handle twitter popup
	const popup = await newPagePromise;

	// twitter login
	await popup.waitForSelector('input[name="session[username_or_email]"]');
	await popup.type('input[name="session[username_or_email]"]', email, {
		delay: 100,
	});

	await popup.waitForSelector('input[name="session[password]"]');
	await popup.type('input[name="session[password]"]', password2, {
		delay: 100,
	});

	await popup.waitForSelector(
		'div[role="button"][data-focusable="true"]:nth-child(2)'
	);
	await popup.click('div[role="button"][data-focusable="true"]:nth-child(2)');

	// typing the tweet
	await popup.waitForSelector(
		'div.DraftEditor-editorContainer div[data-testid="tweetTextarea_0"]'
	);
	await popup.type(
		'div.DraftEditor-editorContainer div[data-testid="tweetTextarea_0"]',
		quote
	);
	await popup.waitForSelector('div[role="button"][data-testid="tweetButton"]');
	await popup.click('div[role="button"][data-testid="tweetButton"]');

	// delay to view the tweet
	await delay(5000);

	// try clicking again
	await popup.click('div[role="button"][data-testid="tweetButton"]');

	// close the popup window
	await popup.close();
}

// function to create HTML from scraped data
async function createHTML(tab, browser) {
	let html = scrapedData.map((obj) => {
		return `<div>
					<h2>${obj.title}</h2>
					<h3>Rating : ${obj.rating}/10</h3>
					<p>${obj.synopsis}</p>
				</div>`;
	});
	finalHtml = `	
						<head>
							<title>Recommendations</title>
							${css}
						</head>
						<body>
							<h1>Watch these movies next ...</h1>
							${html.join('')};
						</body>
					`
	await fs.promises.writeFile("watchNext.html", finalHtml);
	const newTab = await browser.newPage();
	await newTab.goto(`file:${path.join(__dirname, "watchNext.html")}`);
}

// function to mail the PDF
async function mailPDF(toEmail, adminEmail, adminPassword, movieWatched) {
	let transport = nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true, // use SSL
		service: "gmail",
		auth: {
		  user: adminEmail,
		  pass: adminPassword,
		},
		tls: {
		  rejectUnauthorized: false,
		},
	  });
	  let message = {
		from: adminEmail,
		to: toEmail,
		subject: "Your movie recommendations",
		text: `You recently watched ${movieWatched}. Here are some more movies you might like.`,
		attachments: [
		  {
			filename: `${movieWatched}_watchNext.pdf`,
			path: `${currentPath}/watchNext.pdf`,
		  },
		],
	  };
	  transport.sendMail(message, function (err) {
		if (err) {
		  console.log("Failed to send email.\n" + err.message);
		  return;
		}
		console.log("Email sent\n check your email.");
	  });
}

// helper function for navigation
async function navigationHelper(tab, selector) {
	await Promise.all([
		tab.waitForNavigation({
			waitUntil: "networkidle2",
		}),
		tab.click(selector),
	]);
}

// delay function
function delay(time) {
	return new Promise(function (resolve) {
		setTimeout(resolve, time);
	});
}

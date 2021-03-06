var express = require('express');
var router = express.Router();
var async = require('async');

var Twitter = require('twitter-node-client').Twitter;
// var secrets = require('../secrets.js');
var AlchemyAPI = require ('./alchemyapi');
var alchemyapi = new AlchemyAPI();
//Get this data from your twitter apps dashboard
var config = {
    "consumerKey": process.env.TWITTER_CONSUMERKEY,
    "consumerSecret": process.env.TWITTER_CONSUMERSECRET,
    "accessToken": process.env.TWITTER_ACCESSTOKEN,
    "accessTokenSecret": process.env.TWITTER_ACCESSTOKENSECRET,
    "callBackUrl": process.env.TWITTER_CALLBACKURL
}

var twitter = new Twitter(config);

var mstranslator = require('mstranslator');

var client = new mstranslator({
	client_id: process.env.MICROSOFT_CLIENTID,
	client_secret: process.env.MICROSOFT_CLIENTSECRET
}, true);

var languageLookup = {
	'English': 'en',
	'Arabic' : 'ar',
	'Bosnian (Latin)': 'bs-Latn',
	'Bulgarian': 'bg',
	'Catalan': 'ca',
	'Chinese Simplified': 'zh-CHS',
	'Chinese Traditional': 'zh-CHT',
	'Croatian': 'hr',
	'Czech': 'cs',
	'Danish': 'da',
	'Dutch': 'nl',
	'Estonian': 'et',
	'Finnish': 'fi',
	'French': 'fr',
	'German': 'de',
	'Greek': 'el',
	'Hebrew': 'he',
	'Hindi': 'hi',
	'Hungarian': 'hu',
	'Indonesian': 'id',
	'Italian': 'id',
	'Japanese': 'ja',
	'Klingon': 'tlh',
	'Klingon (plqaD)': 'tlh-Qaak',
	'Korean': 'ko',
	'Latvian': 'lv',
	'Lithuanian': 'lt',
	'Malay': 'ms',
	'Norwegian': 'no',
	'Persian': 'fa',
	'Polish': 'pl',
	'Portuguese': 'pt',
	'Romanian': 'ro',
	'Russian': 'ru',
	'Serbian (Cyrillic)': 'sr-Cyrl',
	'Serbian (Latin)': 'sr-Latn',
	'Slovak': 'sk',
	'Slovenian': 'sl',
	'Spanish': 'es',
	'Swedish': 'sv',
	'Thai': 'th',
	'Turkish': 'tr',
	'Ukrainian': 'uk',
	'Urdu': 'ur',
	'Vietnamese': 'vi',
	'Welsh': 'cy'
};


function getRandomPeriod() {
    return Math.floor(Math.random() * (12 + 1)) + 8;
}

/* GET login page. */
router.get('/', function(req, res) {
	// Display the Login page with any flash message, if any
	var languages = Object.keys(languageLookup);
	res.render('index', {
		languages: languages
	});
});
	
/* Handle Login POST */
router.post('/ipsify', function (req, res, next) {
	var twitterHandle = req.body.twitterHandle;
	// var numParagraphs = req.body.numParagraphs;
	var language = req.body.language;
	var languageCode = languageLookup[language];
	var numParagraphs = req.body.numParagraphs;
	if(twitterHandle) {
		res.redirect('/' + languageCode + '/' + twitterHandle + '/' + numParagraphs );
	} else {
		res.redirect('/error');
	}
});

router.get('/:languageCode/:twitterHandle/:numParagraphs', function (req, res) {
	var twitterHandle = req.params.twitterHandle;
	var numParagraphs = parseInt(req.params.numParagraphs);
	var options = {
		screen_name: twitterHandle,
		count: 40 * numParagraphs,
		exclude_replies: true,
		include_rts: false
	}
	twitter.getUserTimeline(options, function (data) {
		res.render('twitterHandle', {
			text: 'Oops! The Twitter handle ' + twitterHandle + ' is not valid!',
			languages: Object.keys(languageLookup)
		});
	}, function (data) {
		var rawTweets = [];
		var json = JSON.parse(data);
		for(var i=0; i < json.length; i++) {
			rawTweets.push(json[i]["text"]);
		}
		var keywords;
		var concatenatedTweets = rawTweets.join(' ');
		var finalStringArray = [];
		alchemyapi.keywords("text", concatenatedTweets, { 'maxRetrieve' : 100 * numParagraphs }, function (response) {
			var keywordsJSON = response['keywords'];
			var numWords = keywordsJSON.length;
			var wordsPerParagraph = Math.floor(numWords / numParagraphs);
			var period = getRandomPeriod();
			var periodCounter = 0;
			var capitalize = false;
			var outputText = '';
			for(var n=0; n<numParagraphs; n++) {
				for(var i = wordsPerParagraph * n; i < wordsPerParagraph * (n+1); i++) {
					var unfilteredText = keywordsJSON[i]['text'];
					var textArray = unfilteredText.split(' ');
					console.log(textArray);
					for(var j=0; j<textArray.length; j++) {
						if(textArray[j].substring(0,4) === 'http') {
							textArray.splice(j, 1);
							j--;
						}
					}
					periodCounter++;
					var filteredText = textArray.join(' ');
					if(filteredText !== '') {
						if(capitalize) {
							filteredText = filteredText.charAt(0).toUpperCase() + filteredText.slice(1);
							capitalize = false;
						}
						if(periodCounter === period) {
							periodCounter = 0;
							period = getRandomPeriod();
							filteredText += '. ';
							capitalize = true;
						}
						finalStringArray.push(filteredText);
					}
				}
				var finalString = finalStringArray.join(' ') + '.\n\n';
				outputText += finalString;
				finalStringArray = [];
				capitalize = true;
			}
			var params = {
				text: outputText,
				from: 'en',
				to: req.params.languageCode
			};
			client.translate(params, function (err, data) {
				var output = data;
				output = 'Lorem ipsum ' + output;
				res.render('twitterHandle', {
					text: output,
					languages: Object.keys(languageLookup)
				});
			});
		});
	});
});

router.get('/error', function (req, res) {
	res.render('error', {
		languages: Object.keys(languageLookup)
	});
})

module.exports = router;



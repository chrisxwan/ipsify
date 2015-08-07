var express = require('express');
var router = express.Router();
var async = require('async');

var Twitter = require('twitter-js-client').Twitter;
var secrets = require('../secrets.js');
var AlchemyAPI = require ('./alchemyapi');
var alchemyapi = new AlchemyAPI();
//Get this data from your twitter apps dashboard
var config = {
    "consumerKey": secrets.twitter.apikey,
    "consumerSecret": secrets.twitter.apisecret,
    "accessToken": secrets.twitter.accesstoken,
    "accessTokenSecret": secrets.twitter.accesstokensecret,
    "callBackUrl": secrets.twitter.callbackUrl
}

var twitter = new Twitter(config);

var mstranslator = require('mstranslator');

var client = new mstranslator({
	client_id: secrets.microsoft.client_id,
	client_secret: secrets.microsoft.client_secret
}, true);


/* GET login page. */
router.get('/', function(req, res) {
	// Display the Login page with any flash message, if any
	res.render('index');
});

/* Handle Login POST */
router.post('/ipsify', function (req, res, next) {
	var twitterHandle = req.body.twitterHandle;
	res.redirect('/' + twitterHandle);
});

router.get('/:twitterHandle', function (req, res) {
	var twitterHandle = req.params.twitterHandle;
	var options = {
		screen_name: twitterHandle,
		count: '50',
		exclude_replies: true,
		include_rts: false
	}
	twitter.getUserTimeline(options, function (data) {
		res.render('/error');
	}, function (data) {
		var rawTweets = [];
		var json = JSON.parse(data);
		for(var i=0; i < json.length; i++) {
			rawTweets.push(json[i]["text"]);
		}
		var keywords;
		var concatenatedTweets = rawTweets.join(' ');
		var finalStringArray = [];
		alchemyapi.keywords("text", concatenatedTweets, { 'maxRetrieve' : 100 }, function (response) {
			keywordsJSON = response['keywords'];
			for(var i = 0; i < keywordsJSON.length; i++) {
				var unfilteredText = keywordsJSON[i]['text'];
				var textArray = unfilteredText.split(' ');
				for(var j=0; j<textArray.length; j++) {
					if(textArray[j].substring(0,4) === 'http') {
						textArray.splice(j, 1);
					}
				}
				var filteredText = textArray.join(' ');
				if(filteredText !== '') {
					finalStringArray.push(filteredText);
				}
			}
			var finalString = 'Lorem ipsum ' + finalStringArray.join(' ');
			res.render('twitterHandle', {
				text: finalString
			});
		});
	});
});

router.get('/error', function (req, res) {
	res.render('error');
});

module.exports = router;



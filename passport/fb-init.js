var FacebookStrategy = require('passport-facebook').Strategy;
var secrets = require('../secrets.js');

module.exports = function (passport) {
	passport.use(new FacebookStrategy({
	  clientID: secrets.appID,
	  clientSecret: secrets.appSecret,
	  callbackURL: secrets.callbackUrl
	}, function(accessToken, refreshToken, profile, done) {
	  process.nextTick(function() {
	  	console.log('facebook authenticated');
	    done(null, profile);
	  });
	}));
	 
	passport.serializeUser(function(user, done) {
	  done(null, user);
	});
	 
	passport.deserializeUser(function(obj, done) {
	  done(null, obj);
	});
};
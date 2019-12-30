const { FB } = require("fb");

const credentials = require("./credentials.json");

const id = "2331485420299032";

FB.options({
  appId: id,
  appSecret: credentials.facebook.secret
});

FB.setAccessToken(`${id}|${credentials.facebook.secret}`);

module.exports = FB;

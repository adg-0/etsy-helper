const api_key = require("../auth/api_key")
const { oauth_codes } = require("../auth/oauth")
const EtsyService = require("../services/etsy-service")



module.exports = (app) => {
	//https://medium.com/@anastasia.bizyayeva/a-comprehensive-guide-to-oauth-2-0-setup-for-etsy-v3-open-api-f514e63b436f
	app.get('/authenticate', async (req, res) => {
		EtsyService.authenticate(api_key.key_string,
								oauth_codes.redirect_uri,
								oauth_codes.code,
								oauth_codes.code_verifier)
		.then(data => {
			res.send(data)
		})
	})
}
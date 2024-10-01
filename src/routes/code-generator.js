const crypto = require("crypto");
const api_key = require("../auth/api_key")
const { oauth_codes } = require("../auth/oauth")
const { url } = require("../services/params")

module.exports = (app) => {

	// The next two functions help us generate the code challenge
	// required by Etsy’s OAuth implementation.
	const base64URLEncode = (str) =>
		str
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=/g, "")

	const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest();

	// We’ll use the verifier to generate the challenge.
	// The verifier needs to be saved for a future step in the OAuth flow.
	const codeVerifier = base64URLEncode(crypto.randomBytes(32));

	// With these functions, we can generate
	// the values needed for our OAuth authorization grant.
	const codeChallenge = base64URLEncode(sha256(codeVerifier));
	const state = Math.random().toString(36).substring(7);
	const codeChallengeMethod = "S256"
	const fullURL = `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=${oauth_codes.redirect_uri}&scope=${oauth_codes.scope.join("%20")}&client_id=${api_key.key_string}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=${codeChallengeMethod}`

	const data = {
		"state": state,
		"code_challenge": codeChallenge,
		"scope": oauth_codes.scope,
		"code_verifier": codeVerifier,
		"code_challenge_method": codeChallengeMethod,
		"redirect_uri": oauth_codes.redirect_uri		
	}

	app.get('/code-gen', async (req, res) => {
		res.send({
			...data,
			"etsy_oauth_url": fullURL,
			"authenticate_url": `${url}/authenticate`
		})
	})
}
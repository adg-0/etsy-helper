const api_key = require("../auth/api_key")
const EtsyService = require("../services/etsy-service")


module.exports = (app) => {
	app.get('/ping', async (req, res) => {
		
		EtsyService.ping(api_key).then(data => {
			console.log(data)
			res.send(data)
		})
	})
}
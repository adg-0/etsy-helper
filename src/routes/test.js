const apiKey = require("../auth/api_key")
const { oauth_codes, token } = require("../auth/oauth")
const EtsyService = require("../services/etsy-service")


module.exports = (app) => {

	const shopName = "ExquisiteBytes"
	const shopId = 41640873
	const taxonomyId = 2078 //"Digital Prints"


	app.get('/test', async (req, res) => {
		
		EtsyService.getShop(apiKey, token, shopName)
		.then(data => {
			res.send(data)
		})
		

		/*EtsyService.getShopSections(apiKey, token, shopId)
		.then(data => {
			res.send(data)
		})*/

		/*EtsyService.getListingsByShop(apiKey, token, shopId, 25)
		.then(data => {
			res.send(data)
		})*/
		
		/*EtsyService.getSellerTaxonomyNodes(apiKey, token)
		.then(data => {
			res.send(data)
		})*/    	

		/*EtsyService.getPropertiesByTaxonomyId(apiKey, token, taxonomyId)
		.then(data => {
			res.send(data)
		})*/
	})
}
const apiKey = require("../auth/api_key")
const { oauth_codes, token } = require("../auth/oauth")
const EtsyService = require("../services/etsy-service")
const {
	getIdSkuFromListings,
	getListingDirsWithIdSkus
} = require("../helpers/tools")
const fs = require('fs')



module.exports = (app) => {

	const baseDir = "/home/eisti/0Etsy/tools/"
	const shopName = "ExquisiteBytes"
	const shopID = 41640873
	const stateArray = ["active", "inactive", "draft"]


	// Todo put in other file because it's used by update and listing ids and upload
	//can work with all active listings
	const getListingsByShop = (apiKey, token, shopID, state="inactive", offset=0, arrayAcc=[]) => {
		return EtsyService.getListingsByShop(apiKey, token, shopID,
									  limit=100, state=state, offset=offset)
		.then(dataListings => {

			const listingArray = getIdSkuFromListings(dataListings)
			offset += limit

			if (offset > dataListings.count){
				return arrayAcc.concat(listingArray)
			} else {
				return getListingsByShop(apiKey, token, shopID, state, offset, arrayAcc.concat(listingArray))
			}
		})
		.catch(error => {
			console.error(error)
		})
	}


	app.get('/listing-ids', async (req, res) => {

		let state
		if (req.query.state){
			state = req.query.state
			if (!stateArray.includes(state)) {
				return res.status(400).json({ error: `invalid state ${state}` })	
			}
		} else {
			state = "inactive"
		}

		const listingIdSkuArray = await getListingsByShop(apiKey, token, shopID, state)
		console.log(`Found ${listingIdSkuArray.length} ${state} listings`)

		const listingPathIdSkuArray = getListingDirsWithIdSkus(baseDir, listingIdSkuArray)
		console.log(`Found ${listingPathIdSkuArray.length} listings matching in ${baseDir}`)

		res.send({
			count: listingPathIdSkuArray.length,
			full_info: listingPathIdSkuArray,
			ids: listingPathIdSkuArray.map(listing => listing.id)
		})
	})
}

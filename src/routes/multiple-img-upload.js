const apiKey = require("../auth/api_key")
const { oauth_codes, token } = require("../auth/oauth")
const EtsyService = require("../services/etsy-service")
const {
	sleep,
	forEachWithCallback,
	getIdSkuFromListings,
	getListingDirsWithIdSkus,
	getListingPngs,
	readMockUps,
	mapRankToName
} = require("../helpers/tools")
const path = require('path')



module.exports = (app) => {

	const baseDir = "/home/eisti/0Etsy/tools/"
	//const baseDir = "/home/eisti/0Etsy/listings/"
	const imgFolderToUpload = `${baseDir}mockup/`
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


	// Todo put in other file because it's used by update / upload and create
	// rank is different
	const uploadListingIMG = async (imgUploadArray, apiKey, token, shopID, listingIdSkuObj, resObj={success:[],fail:[]}) => {
		await sleep(300)
		const imgReadStream = imgUploadArray.pop()
		const imgForm = {
			image: {
				value: imgReadStream,
				options: {
					filename: path.basename(imgReadStream.path),
					contentType: null
				}
			},
			alt_text: path.basename(imgReadStream.path),
			rank: mapRankToName(path.basename(imgReadStream.path))
		}
		EtsyService.uploadListingImage(apiKey, token, shopID, listingIdSkuObj.id, imgForm)
		.then(dataListingImg => {
			resObj.success.push(dataListingImg.alt_text)
		})
		.catch(errorListingImg => {
			console.log(errorListingImg)	
			resObj.fail.push(imgForm.alt_text)
		})
		.finally(_ => {
			if (imgUploadArray.length > 0) {
				uploadListingIMG(imgUploadArray, apiKey, token, shopID, listingIdSkuObj, resObj)
			} else {
				console.log({
					task: "post images to listing",
					listing_id: listingIdSkuObj.id,
					listing_sku: listingIdSkuObj.sku,
					...resObj
				})
			}
		})
	}


	// this upload an array of images to several listings
	app.get('/multiple-img-upload', async (req, res) => {

		let state
		if (req.query.state){
			state = req.query.state
			if (!stateArray.includes(state)) {
				return res.status(400).json({ error: `invalid state ${state}` })	
			}
		} else {
			state = "draft"
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

		listingPathIdSkuArray.forEachWithCallback(async (listingPathIdSkuObj, i, next) => {
			// here to avoid EventEmitter memory leak, otherwise shallow copy [...mockupsImgUploadArray]
			const mockupsPathArray = getListingPngs(imgFolderToUpload)
			const mockupsImgUploadArray = readMockUps(mockupsPathArray)

			uploadListingIMG(mockupsImgUploadArray, apiKey, token, shopID, listingPathIdSkuObj)
			next()
		})
	})
}

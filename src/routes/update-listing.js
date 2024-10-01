const apiKey = require("../auth/api_key")
const { oauth_codes, token } = require("../auth/oauth")
const EtsyService = require("../services/etsy-service")
const {
	sleep,
	forEachWithCallback,
	getIdSkuFromListings,
	getListingDirsWithIdSkus,
	getUploadArrays,
	mapRankToName
} = require("../helpers/tools")
const path = require('path')



module.exports = (app) => {

	const baseDir = "/home/eisti/0Etsy/tools/"
	//const baseDir = "/home/eisti/0Etsy/listings/"
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


	const deleteListingImage = async (listingImgIDArray, apiKey, token, shopID, listingIdSkuObj, resObj={success:[],fail:[]}) => {
		const listingImgID = listingImgIDArray.pop()

		await EtsyService.deleteListingImage(apiKey, token, shopID, listingIdSkuObj.id, listingImgID.id)
		.then(_ => {
			resObj.success.push(listingImgID.alt_text)
		})
		.catch(errorDeleteIMG => {
			console.log(errorDeleteIMG)	
			resObj.fail.push(listingImgID.alt_text)
		})
		.finally(_ => {
			if (listingImgIDArray.length > 0) {
				deleteListingImage(listingImgIDArray, apiKey, token, shopID, listingIdSkuObj, resObj)
			} else {
				console.log({
					task: "delete images from listing",
					listing_id: listingIdSkuObj.id,
					listing_sku: listingIdSkuObj.sku,
					...resObj
				})
			}
		})
	}


	const deleteListingFile = async (listingFileIDArray, apiKey, token, shopID, listingIdSkuObj, resObj={success:[],fail:[]}) => {
		const listingFileID = listingFileIDArray.pop()

		await EtsyService.deleteListingFile(apiKey, token, shopID, listingIdSkuObj.id, listingFileID.id)
		.then(_ => {
			resObj.success.push(listingFileID.filename)
		})
		.catch(errorDeleteFile => {
			console.log(errorDeleteFile)	
			resObj.fail.push(listingFileID.filename)
		})
		.finally(_ => {
			if (listingFileIDArray.length > 0) {
				deleteListingFile(listingFileIDArray, apiKey, token, shopID, listingIdSkuObj, resObj)
			} else {
				console.log({
					task: "delete files from listing",
					listing_id: listingIdSkuObj.id,
					listing_sku: listingIdSkuObj.sku,
					...resObj
				})
			}
		})
	}


	// Todo put in other file because it's used by update / upload and create
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


	// Todo put in other file because it's used by update and create
	const uploadListingFile = (fileUploadArray, apiKey, token, shopID, listingIdSkuObj, resObj={success:[],fail:[]}) => {
		const fileReadStream = fileUploadArray.pop()
		const fileForm = {
			file: fileReadStream,
			name: path.basename(fileReadStream.path),
			rank: 1
		}
		EtsyService.uploadListingFile(apiKey, token, shopID, listingIdSkuObj.id, fileForm)
		.then(dataListingFile => {
			resObj.success.push(dataListingFile.filename)
		})
		.catch(errorListingFile => {
			console.log(errorListingFile)	
			resObj.fail.push(fileForm.name)
		})
		.finally(_ => {
			if (fileUploadArray.length > 0) {
				uploadListingIMG(fileUploadArray, apiKey, token, shopID, listingIdSkuObj, resObj)
			} else {
				console.log({
					task: "post files to listing",
					listing_id: listingIdSkuObj.id,
					listing_sku: listingIdSkuObj.sku,
					...resObj
				})
			}
		})
	}


	// this update will delete all imgs/files then upload new ones because images have changed and they don't have alt_text which they need for future dev
	app.get('/update-listing', async (req, res) => {

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
			// gets all file IDs from listing
			await EtsyService.getListingFiles(apiKey, token, shopID, listingPathIdSkuObj.id)
			.then(async dataListingsFiles => {
				const listingFileIDArray = dataListingsFiles.results.map(listingFile => {
					return {
						id: listingFile.listing_file_id,
						filename: listingFile.filename
					}
				})

				// deletes all files IDs from listing
				await deleteListingFile(listingFileIDArray, apiKey, token, shopID, listingPathIdSkuObj)
			})
			.catch(errorGetFileIDs => {
				console.log({
					...errorGetFileIDs,
					listing_id: listingPathIdSkuObj.id,
					listing_sku: listingPathIdSkuObj.sku
				})	
			})

			// gets all img IDs from listing
			await EtsyService.getListingImages(apiKey, token, listingPathIdSkuObj.id)
			.then(async dataListingsIMGs => {
				const listingImgIDArray = dataListingsIMGs.results.map(listingIMG => {
					return {
						id: listingIMG.listing_image_id,
						alt_text: listingIMG.alt_text
					}
				})
				// deletes all imgs IDs from listing
				await deleteListingImage(listingImgIDArray, apiKey, token, shopID, listingPathIdSkuObj)
			})
			.catch(errorGetImgIDs => {
				console.log({
					...errorGetImgIDs,
					listing_id: listingPathIdSkuObj.id,
					listing_sku: listingPathIdSkuObj.sku
				})	
			})

			const { imgUploadArray, fileUploadArray } = getUploadArrays(listingPathIdSkuObj.path)

			uploadListingIMG(imgUploadArray, apiKey, token, shopID, listingPathIdSkuObj)
			uploadListingFile(fileUploadArray, apiKey, token, shopID, listingPathIdSkuObj)

			next()
		})
	})
}

const apiKey = require("../auth/api_key")
const { oauth_codes, token } = require("../auth/oauth")
const EtsyService = require("../services/etsy-service")
const {
	sleep,
	forEachWithCallback,
	getListingDirs,
	getXXXFromXXXPath,
	getUploadArrays,
	readTxtFile,
	processTitle,
	readVideoStream,
	mapRankToName
} = require("../helpers/tools")
const fs = require('fs')
const path = require('path')



module.exports = (app) => {

	const baseDir = "/home/eisti/0Etsy/tools/"
	const shopName = "ExquisiteBytes"
	const shopID = 41640873
	const taxonomyId = 2078 //"Digital Prints"
	let listingNumber = 1 // put in request params ?


	const buildListing = (xxxFolder) => {
		const title = processTitle(xxxFolder)
		const description = readTxtFile(xxxFolder, "description")
		const tags = readTxtFile(xxxFolder, "tags").split(", ")

		return {
			quantity: 999,
			title: title,
			description: description,
			price: 1.50,
			who_made: "i_did",
			when_made: "2020_2023",
			taxonomy_id: taxonomyId,
			//item_width: 13.5,				//null in the response
			//item_height: 20.5,				//null in the response
			item_dimensions_unit: "inches",
			tags: tags,
			should_auto_renew: true,
			/*shipping_profile_id: null,
			return_policy_id: 1,
			materials: null,
			shop_section_id: null,				// int -> japanese scenery, autumn scenery, etc
			processing_min: null,
			processing_max: null,
			styles: null,
			item_weight: null,
			item_length: null,
			item_weight_unit: null,
			is_personalizable: false,
			personalization_is_required: false,
			personalization_char_count_max: null,
			personalization_instructions: null,
			production_partner_ids: null,
			image_ids: null, 					// check here maybe for images
			is_supply: false,
			is_customizable: false,
			is_taxable: true,*/
			type: "download"
		}
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

	// TODO https://developer.etsy.com/documentation/reference/#operation/uploadListingVideo

	app.get('/create-listing', async (req, res) => {

		let bundle
		if (req.query.bundle){
			bundle = req.query.bundle
			if (! fs.existsSync(`${baseDir}${bundle}/`)) {
				return res.status(400).json({ error: `invalid bundle_sku : ${bundle}` })	
			}	
		}

		const listingDirs = bundle ? [`${baseDir}${bundle}/`] : getListingDirs(baseDir)

		listingDirs.forEachWithCallback((xxxFolder, i, next) => {

			const { imgUploadArray, fileUploadArray } = getUploadArrays(xxxFolder, bundle)

			const listing = buildListing(xxxFolder)

			setTimeout(() => {
				EtsyService.createDraftListing(apiKey, token, shopID, listing)
				.then(dataListing => {
					const productForm = {
						"products": [
							{
								"sku": getXXXFromXXXPath(xxxFolder),
								"offerings": [
									{
										"quantity": listing.quantity,
										"is_enabled": true,
										"price": listing.price
									}
								]
							}
						]
					}
					EtsyService.addListingSKU(apiKey, token, dataListing.listing_id, productForm)
					.then(dataProducts => {
						const listingPathIdSku = {
							id: dataListing.listing_id,
							sku: dataProducts.products[0].sku,
							path: xxxFolder
						}
						console.log({
							task: "post listing + sku",
							...listingPathIdSku
						})

						uploadListingIMG(imgUploadArray, apiKey, token, shopID, listingPathIdSku)
						uploadListingFile(fileUploadArray, apiKey, token, shopID, listingPathIdSku)
					
						if (bundle) {
							const videoReadStream = readVideoStream(`${baseDir}${bundle}/`)
							const videoForm = {
								video: {
									value: videoReadStream,
									options: {
										filename: path.basename(videoReadStream.path),
										contentType: null
									}
								},
								name: path.basename(videoReadStream.path),
							}

							const objLog = {
								task: "post video to bundle",
								listing_id: listingPathIdSku.id,
								listing_sku: listingPathIdSku.sku						
							}

							EtsyService.uploadListingVideo(apiKey, token, shopID, listingPathIdSku.id, videoForm)
							.then(dataListingVideo => {
								console.log({
									...objLog,
									success: [videoForm.name],
									fail: []
								})
							})
							.catch(errorListingVideo => {
								console.log({
									...objLog,
									success: [],
									fail: [videoForm.name]
								})
							})
						}

					})
					.catch(errorProducts => {
						console.log({
							...errorProducts,
							listing_error: xxxFolder
						})
					})
				})
				.catch(errorListing => {
					console.log({
						...errorListing,
						listing: xxxFolder
					})
				})
				next();
			}, 300);
			listingNumber += 1
		})
		res.send(null)
	})
}
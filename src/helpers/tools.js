const fs = require('fs')
const path = require('path')



// token is a json object
const writeTokenToDisk = (token) => {
	// absolute path relative path
	const tokenPath = path.resolve(__dirname, "../auth/token.json")
	const jsonString = JSON.stringify(token)
	fs.writeFile(tokenPath, jsonString, err => {
		if (err) {
			console.log('Error writing token to disk', err)
		} else {
			console.log('Successfully wrote token to disk')
		}
	})  
}


const loadToken = () => {
	// absolute path relative path
	const tokenPath = path.resolve(__dirname, "../auth/token.json")
	try {
		const jsonBuffer = fs.readFileSync(tokenPath)
		return JSON.parse(jsonBuffer)
	} catch (e) {
		console.log(e)
		return
	}
}


const sleep = (ms) => {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}


// making the forEach() function asynchronous
function forEachWithCallback(callback) {
	const arrayCopy = this;
	let index = 0;
	const next = () => {
		index++;
		if (arrayCopy.length > 0) {
			callback(arrayCopy.shift(), index, next);
		}
	}
	next()
}
Array.prototype.forEachWithCallback = forEachWithCallback;


const getListingDirs = (parentDir) => {
	return fs.readdirSync(parentDir, {withFileTypes: true})
	.filter(item => !isNaN(Number(item.name)))	
	.map(folder => `${parentDir}${folder.name}/`)
}


const getXXXFromXXXPath = (xxxPath) => {
	return path.basename(xxxPath)
}


// gets all png files from $parentDir
const getListingPngs = (parentDir) => {
	return fs.readdirSync(parentDir, {withFileTypes: true})
	.filter(item => !item.isDirectory() && item.name.includes(".png"))
	.map(file => `${parentDir}${file.name}`)
}


const readTxtFile = (dir, filename) => {
	return fs.readFileSync(`${dir}${filename}.txt`, "utf8")
}


const processTitle = (folder) => {
	const title = readTxtFile(folder, "title")
	const split_title = title.split("#")
	if (split_title[1].length == 0) { // if "skdcncjn, #"
		return split_title.join(`#${listingNumber}`)
	} else { // if "sdc, #xx"
		return title
	}
}


// returns an array containing all imgs, where 'keyword' is in the path, as read streams
const readImgFromKeyWord = (filepathArray, keyWord) => {
	filepaths = filepathArray.filter(filepath => filepath.includes(keyWord))
	return filepaths.map(filepath => fs.createReadStream(filepath))
}


// returns a read stream of 1 img with dim in name
const readImgStream = (filepathArray, dimSubstring) => {
	return readImgFromKeyWord(filepathArray, dimSubstring).pop()
}


// returns a read stream of 1 pdf with link in name
const readPdf = (dir, filename) => {
	return fs.createReadStream(`${dir}${filename}.pdf`)
}


// returns an array containing all mockup imgs as read streams
const readInformations = (filepathArray) => {
	return readImgFromKeyWord(filepathArray, "information")
}


// returns an array containing all information imgs as read streams
const readMockUps = (filepathArray) => {
	return readImgFromKeyWord(filepathArray, "mockup")
}


// returns a read stream of 1 mp4 file
const readVideoStream = (dir) => {
	return fs.createReadStream(`${dir}mockup_video.mp4`)
}


// returns array of img streams & array of file streams
const getUploadArrays = (folder, isBundle=false) => {
	// all png file paths from folder in an array
	const listingPngs = getListingPngs(folder)

	const fileUploadArray = [readPdf(folder, "link")]
	// all mockup img streams from folder
	const mockupsArray = readMockUps(listingPngs)
	// all info img streams from folder
	const informationImgUploadArray = readInformations(listingPngs).reverse()
	if (!isBundle) {
		mockupsArray.push(readImgStream(listingPngs, "2048"))
	}
	const mockupsImgUploadArray = mockupsArray.reverse()
	// all the reverses performed to try and have the right order when downloading imgs to listing
	const imgUploadArray = [...informationImgUploadArray, ...mockupsImgUploadArray].reverse()

	return { imgUploadArray, fileUploadArray }
}


// returns an array containing listings ids and skus
const getIdSkuFromListings = (listingsAPIResponse) => {
	return listingsAPIResponse.results.map(listing => {
		return {
			id: listing.listing_id,
			sku: listing.skus[0]
		}
	})
}


/*
From all listing folders in $parentDir, will match names with skus in $skuArray
$skuArray also contains ids associated with skus
returns an array of objects containing id, sku, path on disk
*/
const getListingDirsWithIdSkus = (parentDir, skuArray) => {
	const matchSKU = (item, array) => {
		return array.filter(obj => item == obj.sku)
	}

	return fs.readdirSync(parentDir, {withFileTypes: true})
	.filter(item => !isNaN(Number(item.name))) // comment out to get the bundles
	.map(folder => {
		match = matchSKU(folder.name, skuArray)
		if (match.length == 1){
			return {
				path: `${parentDir}${folder.name}/`,
				sku: folder.name,
				id: match[0].id
			}
		} else { // no match
			return undefined
		}
	})
	.filter(obj => obj !== undefined)
}


const mapRankToName = (name) => {
	const map = {
		"mockup1.png": 1,
		"mockup2.png": 1,
		"mockup3.png": 1,
		"mockup4.png": 1,
		"mockup5.png": 1,
		"mockup6.png": 1,
		"mockup7.png": 1,
		"2048.png": 1,
		"12x18.png": 1,
		"13.5x13.5.png": 1,
		"13.5x20.5.png": 1,
		"20.5x13.5.png": 1,
		"18x12.png": 1,
		"clipart.png": 1,
		"general.png": 1,
		"mockupX.png": 10
	}
	return map[name.split("_").pop()]
}


module.exports = {
	writeTokenToDisk,
	loadToken,
	sleep,
	forEachWithCallback,
	getListingDirs,
	getXXXFromXXXPath,
	getListingPngs,
	processTitle,
	readTxtFile,
	readImgStream,
	readPdf,
	readInformations,
	readMockUps,
	readVideoStream,
	getUploadArrays,
	getIdSkuFromListings,
	getListingDirsWithIdSkus,
	mapRankToName
}
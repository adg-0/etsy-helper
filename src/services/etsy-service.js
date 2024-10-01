// todo : créer modeles listings etc

const request = require("request")

module.exports = class EtsyService {

	static ping(api_key) {
		return fetch(`https://api.etsy.com/v3/application/openapi-ping`, {
			method: "GET",
			headers: {
				'x-api-key': api_key.key_string,
			}
		}).then(res => res.json())
		.catch(error => this.handleError(error))
	}

	static authenticate(clientID, redirectUri, authCode, clientVerifier) {
		return fetch("https://api.etsy.com/v3/public/oauth/token", {
			method: 'POST',
			body: JSON.stringify({
				grant_type: "authorization_code",
				client_id: clientID,
				redirect_uri: redirectUri,
				code: authCode,
				code_verifier: clientVerifier,
			}),
			headers: {
				"Accept": "application/json",
				'x-api-key': clientID
			}
		}).then(res => res.json())
		.catch(error => this.handleError(error))
	}

	static refreshToken(api_key, token) {
		return new Promise((resolve, reject) => {
			fetch(`https://api.etsy.com/v3/public/oauth/token`, {
				method: "POST",
				body: JSON.stringify({
					grant_type: "refresh_token",
					client_id: api_key.key_string,
					refresh_token: token.refresh_token
				}),
				headers: {
					"Accept": "application/json",
					'x-api-key': api_key.key_string
				}
			}).then(response => {
				if (response.ok) {
					response.json().then(data => {
						//console.log(data)
						resolve(data)
					})
				} else {
					response.json().then(error => {
						//this.handleError(error)
						reject(error)
					})				
				}
			})
			.catch(error => this.handleError(error))
		})
	}

	static getShop(api_key, token, shopName) {
		return fetch(`https://api.etsy.com/v3/application/shops?shop_name=${shopName}`, {
			method: "GET",
			headers: {
				'x-api-key': api_key.key_string,
				"Authorization": `Bearer ${token.access_token}`
			}
		}).then(res => res.json())
		.catch(error => this.handleError(error))
	}

	static getShopSections(api_key, token, shopID) {
		return fetch(`https://openapi.etsy.com/v3/application/shops/${shopID}/sections`, {
			method: "GET",
			headers: {
				'x-api-key': api_key.key_string,
				"Authorization": `Bearer ${token.access_token}`
			}
		}).then(res => res.json())
		.catch(error => this.handleError(error))
	}

	static getListingsByShop(api_key, token, shopID, limit=100, state="active", offset=0) {
		return new Promise((resolve, reject) => {
			fetch(`https://openapi.etsy.com/v3/application/shops/${shopID}/listings?limit=${limit.toString()}&state=${state}&offset=${offset.toString()}`, {
				method: "GET",
				headers: {
					'x-api-key': api_key.key_string,
					"Authorization": `Bearer ${token.access_token}`
				}
			}).then(response => {
				if (response.ok) {
					response.json().then(data => {
						//console.log(data)
						resolve(data)
					})
				} else {
					response.json().then(error => {
						//this.handleError(error)
						reject(error)
					})				
				}
			})
			.catch(error => this.handleError(error))
		})
	}

	static getSellerTaxonomyNodes(api_key, token) {
		return fetch(`https://openapi.etsy.com/v3/application/seller-taxonomy/nodes`, {
			method: "GET",
			headers: {
				'x-api-key': api_key.key_string,
				"Authorization": `Bearer ${token.access_token}`
			}
		}).then(res => res.json())
		.catch(error => this.handleError(error))
	}

	static getPropertiesByTaxonomyId(api_key, token, taxonomyId) {
		return fetch(`https://openapi.etsy.com/v3/application/seller-taxonomy/nodes/${taxonomyId}/properties`, {
			method: "GET",
			headers: {
				'x-api-key': api_key.key_string,
				"Authorization": `Bearer ${token.access_token}`
			}
		}).then(res => res.json())
		.catch(error => this.handleError(error))
	}

	static createDraftListing(api_key, token, shopID, listing) {
		return new Promise((resolve, reject) => {
			fetch(`https://openapi.etsy.com/v3/application/shops/${shopID}/listings`, {
				method: "POST",
				body: JSON.stringify(listing),
				headers: {
					"Accept": "application/json",
					'x-api-key': api_key.key_string,
					"Authorization": `Bearer ${token.access_token}`
				}
			}).then(response => {
				if (response.ok) {
					response.json().then(data => {
						//console.log(data)
						resolve(data)
					})
				} else {
					response.json().then(error => {
						//this.handleError(error)
						reject(error)
					})				
				}
			})
			.catch(error => this.handleError(error))
		})
	}

	static addListingSKU(api_key, token, listingID, product_form) {
		return new Promise((resolve, reject) => {
			fetch(`https://openapi.etsy.com/v3/application/listings/${listingID}/inventory`, {
				method: "PUT",
				body: JSON.stringify(product_form),
				headers: {
					"Accept": "application/json",
					'x-api-key': api_key.key_string,
					"Authorization": `Bearer ${token.access_token}`
				}
			}).then(response => {
				if (response.ok) {
					response.json().then(data => {
						//console.log(data)
						resolve(data)
					})
				} else {
					response.json().then(error => {
						//this.handleError(error)
						reject(error)
					})				
				}
			})
			.catch(error => this.handleError(error))
		})
	}

	static getListingImages(api_key, token, listingID) {
		return new Promise((resolve, reject) => {
			fetch(`https://openapi.etsy.com/v3/application/listings/${listingID}/images`, {
				method: "GET",
				headers: {
					'x-api-key': api_key.key_string,
					"Authorization": `Bearer ${token.access_token}`
				}
			}).then(response => {
				if (response.ok) {
					response.json().then(data => {
						//console.log(data)
						resolve(data)
					})
				} else {
					response.json().then(error => {
						//this.handleError(error)
						reject(error)
					})				
				}
			})
			.catch(error => this.handleError(error))
		})
	}

	static uploadListingImage(api_key, token, shopID, listingID, imgForm) {
		let options = {
			method: 'POST',
			url: `https://openapi.etsy.com/v3/application/shops/${shopID}/listings/${listingID}/images`,
			headers: {
				'Content-Type': 'multipart/form-data',
				'x-api-key': api_key.key_string,
				'Authorization': `Bearer ${token.access_token}`
			},
			formData: imgForm
		}
		return new Promise((resolve, reject) => {
			request(options, function (error, response) {
				// codes from 200 to 299, for some reason 'response' is not an object from Response class
				const okCodes = [...Array(100).keys()].map(x => x + 200)
				const responseOK = okCodes.includes(response.statusCode)

				if (error || !responseOK) {
					reject(JSON.parse(response.body))
				} else {
					resolve(JSON.parse(response.body))
				}
			})
		})
		.catch(error => this.handleError(error))
	}

	static deleteListingImage(api_key, token, shopID, listingID, listingImgID) {
		return new Promise((resolve, reject) => {
			fetch(`https://openapi.etsy.com/v3/application/shops/${shopID}/listings/${listingID}/images/${listingImgID}`, {
				method: "DELETE",
				headers: {
					'x-api-key': api_key.key_string,
					"Authorization": `Bearer ${token.access_token}`
				}
			}).then(response => {
				if (response.ok) {
					resolve()
				} else {
					response.json().then(error => {
						//this.handleError(error)
						reject(error)
					})				
				}
			})
			.catch(error => this.handleError(error))
		})
	}

	static getListingFiles(api_key, token, shopID, listingID) {
		return new Promise((resolve, reject) => {
			fetch(`https://openapi.etsy.com/v3/application/shops/${shopID}/listings/${listingID}/files`, {
				method: "GET",
				headers: {
					'x-api-key': api_key.key_string,
					"Authorization": `Bearer ${token.access_token}`
				}
			}).then(response => {
				if (response.ok) {
					response.json().then(data => {
						//console.log(data)
						resolve(data)
					})
				} else {
					response.json().then(error => {
						//this.handleError(error)
						reject(error)
					})				
				}
			})
			.catch(error => this.handleError(error))
		})
	}

	static uploadListingFile(api_key, token, shopID, listingID, fileForm) {
		let options = {
			method: 'POST',
			url: `https://openapi.etsy.com/v3/application/shops/${shopID}/listings/${listingID}/files`,
			headers: {
				'Content-Type': 'multipart/form-data',
				'x-api-key': api_key.key_string,
				'Authorization': `Bearer ${token.access_token}`	
			},
			formData: fileForm
		}
		return new Promise((resolve, reject) => {
			request(options, function (error, response) {
				// codes from 200 to 299, for some reason 'response' is not an object from Response class
				const okCodes = [...Array(100).keys()].map(x => x + 200)
				const responseOK = okCodes.includes(response.statusCode)

				if (error || !responseOK) {
					reject(JSON.parse(response.body))
				} else {
					resolve(JSON.parse(response.body))
				}
			})
		})
		.catch(error => this.handleError(error))
	}

	static deleteListingFile(api_key, token, shopID, listingID, listingFileID) {
		return new Promise((resolve, reject) => {
			fetch(`https://openapi.etsy.com/v3/application/shops/${shopID}/listings/${listingID}/files/${listingFileID}`, {
				method: "DELETE",
				headers: {
					'x-api-key': api_key.key_string,
					"Authorization": `Bearer ${token.access_token}`
				}
			}).then(response => {
				if (response.ok) {
					resolve()
				} else {
					response.json().then(error => {
						//this.handleError(error)
						reject(error)
					})				
				}
			})
			.catch(error => this.handleError(error))
		})
	}







	static uploadListingVideo(api_key, token, shopID, listingID, videoForm) {
		let options = {
			method: 'POST',
			url: `https://openapi.etsy.com/v3/application/shops/${shopID}/listings/${listingID}/videos`,
			headers: {
				'Content-Type': 'multipart/form-data',
				'x-api-key': api_key.key_string,
				'Authorization': `Bearer ${token.access_token}`	
			},
			formData: videoForm
		}
		return new Promise((resolve, reject) => {
			request(options, function (error, response) {
				// codes from 200 to 299, for some reason 'response' is not an object from Response class
				const okCodes = [...Array(100).keys()].map(x => x + 200)
				const responseOK = okCodes.includes(response.statusCode)

				if (error || !responseOK) {
					reject(JSON.parse(response.body))
				} else {

					resolve(JSON.parse(response.body))
				}
			})
		})
		.catch(error => this.handleError(error))
	}




















	static handleError(error) {
		console.error(error)
	}
}
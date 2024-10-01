const api_key = require("../auth/api_key")
const { token } = require("../auth/oauth")
const EtsyService = require("../services/etsy-service")
const { writeTokenToDisk } = require("../helpers/tools")
const fs = require('fs')
const path = require('path')



module.exports = (app) => {
	app.get('/refresh-token', async (req, res) => {
    	EtsyService.refreshToken(api_key, token)
    	.then(token => {
    		if (Object.keys(token).length !== 0) {
    			writeTokenToDisk(token)
    		}
			res.send(token)
    	})
    	.catch(errorToken => {
    		console.log(errorToken)
    		res.send(errorToken)
    	})
	})
}
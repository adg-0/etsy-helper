const { loadToken } = require("../helpers/tools")
const fs = require("fs")
const path = require('path')



const oauth_codes = {
	redirect_uri: "https://eovti1iq7frqogg.m.pipedream.net",
	state: "nsejce",
	scope: ["listings_r", "listings_w", "profile_r", "shops_r"],
	code_challenge: "RrPPsVHTrDKjif3rCIBfgCc7hEfwIh5_l-j902GnIP4",
	code_verifier: "DHZxiakY_1_RWWfmN_rToORsJJfGA91S5sfeQM2Pc70",
	code: "wilgfsLAH4J67XwIBn5FsuyRrwi6aOp1av3aqwh1P_L2OmSc1z4EkkP2u-242fwljPf63lRkSGjZcd4P2cQTKzCv7lEkPLxctzS1"
}


const token = loadToken("./token.json")


module.exports = { oauth_codes, token }
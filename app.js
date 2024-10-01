const express = require("express")
//const fetch = require("node-fetch")
const morgan = require("morgan")
const bodyParser = require("body-parser")
const cors = require("cors")
const hbs = require("hbs")

const { port, url } = require("./src/services/params")


const app = express()
app.set("view engine", "hbs")
app.set("views", `${process.cwd()}/src/views`)


app
	.use(morgan("dev")) // delete for deployment on production
	.use(bodyParser.json())
	.use(cors())

app.get("/", (req, res) => {
	res.render("index")
})

// Ping
require("./src/routes/ping")(app)

// PKCE code challenge
require("./src/routes/code-generator")(app)

// Etsy OAuth token
require("./src/routes/authenticate")(app)

// Etsy refresh token
require("./src/routes/refresh-token")(app)

// Listings
require("./src/routes/create-listing")(app)
require("./src/routes/update-listing")(app)
require("./src/routes/multiple-img-upload")(app)
require("./src/routes/listing-ids")(app)

// Test
require("./src/routes/test")(app)

app.use(({res}) => {
	const msg = "Impossible to find the requested resource. Try another URL"
	res.status(404).json({ message: msg })
})


app.listen(port, () => console.log(`app etsy started on ${url}`))
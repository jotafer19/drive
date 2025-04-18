const {Router} = require("express")
const homeController = require("../controllers/homeController")
const homeRouter = Router()

homeRouter.get("/", homeController.homeGet)
// homeRouter.post("/", homeController.homePost)

module.exports = homeRouter;
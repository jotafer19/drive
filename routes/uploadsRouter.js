const {Router} = require("express")
const homeController = require("../controllers/homeController")
const uploadsRouter = Router()
const upload = require("../config/multer")
// const multer = require("multer")

// const upload = multer({ storage: multer.memoryStorage()})

uploadsRouter.get("/", homeController.homeGet)
uploadsRouter.get("/:folderId", homeController.homeGet)
uploadsRouter.post("/create", homeController.createPost)
uploadsRouter.post("/:folderId/create", homeController.createPost)
uploadsRouter.get("/:folderId/delete", homeController.deleteFolder)
uploadsRouter.post("/:folderId/edit", homeController.editNamePost)
uploadsRouter.get("/file/:fileId/delete", homeController.deleteFile)
uploadsRouter.post("/file", upload.single("file"), homeController.addFilePost)
uploadsRouter.post("/file/:fileId/edit", homeController.editFilePost)
uploadsRouter.post("/:folderId/file", upload.single("file"), homeController.addFilePost)
uploadsRouter.get("/file/:fileId/download", homeController.downloadFile)

module.exports = uploadsRouter;
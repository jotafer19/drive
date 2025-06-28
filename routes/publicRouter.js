const {Router} = require("express")
const publicController = require("../controllers/publicController")
const publicRouter = Router()

publicRouter.get(["/:sharedLinkId", "/:sharedLinkId/:folderId"], publicController.publicFolderGet)
publicRouter.post(["/:folderId"], publicController.publicFolderPost)
publicRouter.get("/:sharedLinkId/:fileId/download", publicController.downloadFileGet)

module.exports = publicRouter
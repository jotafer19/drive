const { Router } = require("express");
const folderController = require("../controllers/folderController");
const folderRouter = Router();

folderRouter.get("/:folderId", folderController.folderGet);
folderRouter.post("/", folderController.createFolderPost);

module.exports = folderRouter;

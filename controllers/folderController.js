const asyncHandler = require("express-async-handler")
const folderQuery = require("../db/folderQuery")

exports.folderGet = async (req, res) => {
    if (!req.isAuthenticated) {
        res.redirect("/login")
    }
    
    const folders = await folderQuery.getNestedFolders(req.user.id, req.params.folderId)
    console.log(folders)
    res.render("home", {
        folders: folders
    })
}

exports.createFolderPost = async (req, res) => {
    const {folderName} = req.body;
    console.log(req.url)
    const parentId = req.params.folderId || null

    await folderQuery.createFolder(folderName, req.user.id, parentId)
}
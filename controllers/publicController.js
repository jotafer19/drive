const asyncHandler = require("express-async-handler")
const folderQuery = require("../db/folderQuery")
const fileQuery = require("../db/fileQuery")
const { supabase } = require("../supabase/supabase");

exports.publicFolderGet = asyncHandler(async (req, res) => {
    const {sharedLinkId} = req.params;

    const sharedLink = await folderQuery.getSharedLink(sharedLinkId)

    if (!sharedLink) {
        const error = new Error("This link does not exist")
        error.status = 404;

        throw error;
    }

    if (new Date() > new Date(sharedLink.expiresAt)) {
        const error = new Error("This link has already expired")
        error.status = 410;

        throw error;
    }

    const rootFolder = await folderQuery.getFolder(sharedLink.userId, sharedLink.folderId)

    if (!rootFolder) {
        const error = new Error("Folder not found")
        error.status = 404;

        throw error;
    }

    const currentFolderId = req.params.folderId || rootFolder.id

    const allowedFoldersAsGuest = await folderQuery.allowedFolders(sharedLink.userId, rootFolder.id)

    const isAllowed = allowedFoldersAsGuest.includes(currentFolderId) || currentFolderId === rootFolder.id;

    if (!isAllowed) {
        const error = new Error("You have no permissions to access this folder")
        error.status = 404;
        throw error;
    }

    const currentFolder = await folderQuery.getFolder(sharedLink.userId, currentFolderId)

    if (!currentFolder) {
        const error = new Error("Folder not found")
        error.status = 404;

        throw error;
    }

    const possibleRoutes = await folderQuery.getFolderRoute(sharedLink.userId, currentFolderId)
    const route = possibleRoutes.filter(route => allowedFoldersAsGuest.includes(route.id))
    route.unshift(rootFolder)

    const childrenFolders = await folderQuery.getNestedFolders(sharedLink.userId, currentFolder.id)
    const files = await fileQuery.getFilesByFolder(sharedLink.userId, currentFolder.id)

    res.render("publicView", {
        sharedLink,
        rootFolder,
        childrenFolders,
        folderRoute: route,
        files
    })
})

exports.publicFolderPost = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const folderId = req.params.folderId || null;
    const {duration} = req.body;
    
    const expiresAt = new Date(Date.now() + Number(duration) * 60 * 60 * 1000);

    const link = await folderQuery.postSharedLink(userId, folderId, expiresAt)

    req.session.sharedLink = `http://localhost:3000/public/${link.id}`;

    res.redirect("/uploads/" + (folderId ? folderId : ""));
})

exports.downloadFileGet = asyncHandler(async (req, res) => {
    const { sharedLinkId, fileId } = req.params

    const sharedLink = await folderQuery.getSharedLink(sharedLinkId)
    
    if (!sharedLink) {
        const error = new Error("This link does not exist")
        error.status = 404;

        throw error;
    }

    if (new Date() > new Date(sharedLink.expiresAt)) {
        const error = new Error("This link has already expired")
        error.status = 410;

        throw error;
    }

    const file = await fileQuery.getFile(sharedLink.userId, fileId)

    if (!file) {
        const error = new Error("File not found")
        error.status = 404;
        throw error;
    }

    const { data, error } = await supabase.storage
        .from("uploads")
        .download(file.bucketId);

    if (error) {
        const err = new Error("Error downloading file");
        err.status = 500;
        throw err;
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
    res.setHeader("Content-Type", data.type || "application/octet-stream");
    res.setHeader("Content-Length", buffer.length);

    res.send(buffer);
})
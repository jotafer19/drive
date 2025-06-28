const folderQuery = require("../db/folderQuery");
const fileQuery = require("../db/fileQuery");
const { supabase } = require("../supabase/supabase");
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const validateFolder = require("../validators/folderValidator");
const validateFile = require("../validators/fileValidator");

exports.homeGet = asyncHandler(async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }

  const currentFolderId = req.params.folderId || null;

  const [folders, folderRoute, parentFolder, files] = await Promise.all([
    folderQuery.getNestedFolders(req.user.id, currentFolderId),
    folderQuery.getFolderRoute(req.user.id, currentFolderId),
    currentFolderId ? folderQuery.getFolder(req.user.id, currentFolderId) : null,
    fileQuery.getFilesByFolder(req.user.id, currentFolderId),
  ]);

  if (currentFolderId && !parentFolder) {
    const error = new Error(
      "The folder you're trying to access does not exist",
    );
    error.status = 404;
    throw error;
  }

  const { createError, oldInput, editError, editTarget, fileError, sharedLink } =
    req.session || {};

  // Clean session
  delete req.session.createError;
  delete req.session.oldInput;
  delete req.session.editError;
  delete req.session.editTarget;
  delete req.session.fileError;
  delete req.session.sharedLink

  res.render("home", {
    parentFolder,
    folders,
    folderRoute,
    files,
    createError,
    oldInput,
    editError,
    editTarget,
    fileError,
    sharedLink
  });
});

exports.createPost = [
  validateFolder,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const folderName = req.body["folder-name"];
    const parentId = req.params.folderId || null;

    if (!errors.isEmpty()) {
      req.session.createError = errors.array()[0].msg;
      req.session.oldInput = folderName;

      return res.redirect("/uploads/" + (parentId ? parentId : ""));
    }

    if (parentId) {
      const folder = await folderQuery.getFolder(req.user.id, parentId)
      if (!folder) {
        const error = new Error("Parent folder not found")
        error.status = 404;
        throw error;
      }
    }

    await folderQuery.createFolder(folderName, req.user.id, parentId);

    res.redirect("/uploads/" + (parentId ? parentId : ""));
  })
];

exports.deleteFolder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const folderId = req.params.folderId || null;

  if (folderId) {
    const folder = await folderQuery.getFolder(userId, folderId)
    if (!folder) {
        const error = new Error("Folder not found")
        error.status = 404;
        throw error;
    }
  } 

  const routes = await folderQuery.getFolderRoute(userId, folderId);
  const parentId = routes[routes.length - 1].parentId;

  await folderQuery.deleteFolder(userId, folderId);

  res.redirect("/uploads/" + (parentId ? parentId : ""));
})

exports.editNamePost = [
  validateFolder,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const userId = req.user.id;
    const folderId = req.params.folderId;
    
    const folder = await folderQuery.getFolder(userId, folderId)

    if (!folder) {
        const error = new Error("Folder not found")
        error.status = 404;
        throw error;
    }

    const routes = await folderQuery.getFolderRoute(userId, folderId);
    const parentId = routes[routes.length - 1].parentId;

    const newName = req.body["folder-name"];

    if (!errors.isEmpty()) {
      req.session.editError = errors.array()[0].msg;
      req.session.editTarget = {
        id: folderId,
        name: newName,
        type: "folder",
      };

      return res.redirect("/uploads/" + (parentId ? parentId : ""));
    }

    await folderQuery.editFolder(userId, folderId, newName);

    res.redirect("/uploads/" + (parentId ? parentId : ""));
  })
];

exports.addFilePost = [
  validateFile,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const userId = req.user.id;
    const folderId = req.params.folderId || null;

    if (!errors.isEmpty()) {
      req.session.fileError = errors.array()[0].msg;

      return res.redirect("/uploads/" + (folderId ? folderId : ""));
    }

    if (folderId) {
      const folder = await folderQuery.getFolder(req.user.id, folderId)
      if (!folder) {
        const error = new Error("Folder not found")
        error.status = 404;
        throw error;
      }
    }

    const { originalname, buffer, mimetype, size } = req.file;

    const supabaseName = uuidv4();

    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(supabaseName, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error("Failed to upload")
    }

    const { data: fileURL } = await supabase.storage
      .from("uploads")
      .createSignedUrl(data.path, 60 * 60);

    await fileQuery.addFile(
      userId,
      folderId,
      originalname,
      size,
      mimetype,
      supabaseName,
      fileURL.signedUrl,
    );

    res.redirect("/uploads/" + (folderId ? folderId : ""));
  })
];

exports.editFilePost = [
  validateFolder,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    const userId = req.user.id;
    const fileId = req.params.fileId;

    const file = await fileQuery.getFile(userId, fileId);

    if (!file) {
        const error = new Error("File not found")
        error.status = 404;
        throw error;
    }

    const newName = req.body["folder-name"];

    if (!errors.isEmpty()) {
      req.session.editError = errors.array()[0].msg;
      req.session.editTarget = {
        id: fileId,
        name: newName,
        type: "file",
      };

      return res.redirect("/uploads/" + (file.folderId ? file.folderId : ""));
    }

    await fileQuery.editFile(userId, fileId, newName);

    res.redirect("/uploads/" + (file.folderId ? file.folderId : ""));
  })
];

exports.deleteFile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const fileId = req.params.fileId;

  const file = await fileQuery.getFile(userId, fileId);

  if (!file) {
    const error = new Error("File not found")
    error.status = 404;
    throw error;
  }

  await fileQuery.deleteFile(userId, fileId);

  const { data, error } = await supabase.storage
    .from("uploads")
    .remove([file.bucketId]);

  res.redirect("/uploads/" + (file.folderId ? file.folderId : ""));
})

exports.downloadFile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const fileId = req.params.fileId;

  const file = await fileQuery.getFile(userId, fileId);

  if (!file) {
    const error = new Error("File not found")
    error.status = 404;
    throw error;
  }

  const { data, error } = await supabase.storage
    .from("uploads")
    .download(file.bucketId);

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
  res.setHeader("Content-Type", data.type || "application/octet-stream");
  res.setHeader("Content-Length", buffer.length);

  res.send(buffer);
});

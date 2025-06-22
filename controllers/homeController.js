const folderQuery = require("../db/folderQuery");
const fileQuery = require("../db/fileQuery");
const { supabase } = require("../supabase/supabase");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const validateFolder = require("../validators/folderValidator");
const validateFile = require("../validators/fileValidator");

exports.homeGet = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }

  const currentFolderId = req.params.folderId || null;

  const folders = await folderQuery.getNestedFolders(
    req.user.id,
    currentFolderId,
  );
  const folderRoute = await folderQuery.getFolderRoute(
    req.user.id,
    currentFolderId,
  );

  const files = await fileQuery.getFilesByFolder(req.user.id, currentFolderId);

  const createError = req.session.createError || null;
  const oldInput = req.session.oldInput || null;
  const editError = req.session.editError || null;
  const editTarget = req.session.editTarget || null;
  const fileError = req.session.fileError || null;

  // Clean session
  req.session.createError = null;
  req.session.oldInput = null;
  req.session.editError = null;
  req.session.editTarget = null;
  req.session.fileError = null;

  res.render("home", {
    parentFolder: currentFolderId
      ? await folderQuery.getFolder(req.user.id, currentFolderId)
      : null,
    folders: folders,
    folderRoute: folderRoute,
    files: files,
    createError,
    oldInput,
    editError,
    editTarget,
    fileError,
  });
};

exports.createPost = [
  validateFolder,
  async (req, res) => {
    const errors = validationResult(req);
    const folderName = req.body["folder-name"];
    const parentId = req.params.folderId || null;

    if (!errors.isEmpty()) {
      req.session.createError = errors.array()[0].msg;
      req.session.oldInput = folderName;

      return res.redirect("/uploads/" + (parentId ? parentId : ""));
    }

    await folderQuery.createFolder(folderName, req.user.id, parentId);

    res.redirect("/uploads/" + (parentId ? parentId : ""));
  },
];

  exports.deleteFolder = async (req, res) => {
    const userId = req.user.id;
    const folderId = req.params.folderId || null;
    const routes = await folderQuery.getFolderRoute(userId, folderId);
    const parentId = routes[routes.length - 1].parentId;

    await folderQuery.deleteFolder(userId, folderId);
    
    res.redirect("/uploads/" + (parentId ? parentId : ""));
  };

exports.editNamePost = [
  validateFolder,
  async (req, res) => {
    const errors = validationResult(req);
    const userId = req.user.id;
    const folderId = req.params.folderId;

    if (!folderId) return;

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
  },
];

exports.addFilePost = [
  validateFile,
  async (req, res) => {
    const errors = validationResult(req);
    const userId = req.user.id;
    const folderId = req.params.folderId || null;

    if (!errors.isEmpty()) {
      req.session.fileError = errors.array()[0].msg;

      return res.redirect("/uploads/" + (folderId ? folderId : ""));
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
      console.error("Upload error:", error);
      return res.status(500).send("Failed to upload");
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
  },
];

exports.editFilePost = [
  validateFolder,
  async (req, res) => {
    const errors = validationResult(req);

    const userId = req.user.id;
    const fileId = req.params.fileId;

    const file = await fileQuery.getFile(userId, fileId);

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
  },
];

exports.deleteFile = async (req, res) => {
  const userId = req.user.id;
  const fileId = req.params.fileId;

  const file = await fileQuery.getFile(userId, fileId);

  await fileQuery.deleteFile(userId, fileId);

  const { data, error } = await supabase.storage
    .from("uploads")
    .remove([file.bucketId]);

  res.redirect("/uploads/" + (file.folderId ? file.folderId : ""));
};

exports.downloadFile = async (req, res) => {
  const userId = req.user.id;
  const fileId = req.params.fileId;

  const file = await fileQuery.getFile(userId, fileId);

  const { data, error } = await supabase.storage
    .from("uploads")
    .download(file.bucketId);

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
  res.setHeader("Content-Type", data.type || "application/octet-stream");
  res.setHeader("Content-Length", buffer.length);

  res.send(buffer);
};

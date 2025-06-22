const { body } = require("express-validator");

const validFileTypes = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",

  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",

  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet",

  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "application/zip",
  "application/x-rar-compressed",
];

const validateFile = [
  body("file").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("You should add a file");
    }

    if (!validFileTypes.includes(req.file.mimetype)) {
      throw new Error(
        "Only files of type JPG, JPEG, PNG, WEBP, AVIF, SVG, PDF, TXT, DOC, ODT, DOCX, XLS, XLSX, PPT, and PPTX are allowed",
      );
    }

    if (req.file.size > 10 * 1024 * 1024) {
      throw new Error("Max size: 10MB");
    }

    return true;
  }),
];

module.exports = validateFile;

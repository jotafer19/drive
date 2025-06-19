const {body} = require("express-validator")

const validateFolder = [
    body("folder-name")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("Folder name cannot be empty")
        .isLength({ min: 1, max: 50 })
        .withMessage("Folder name must be no longer than 20 characters")
        .matches(/^[a-zA-Z0-9_\-\sñÑ]+$/)
        .withMessage("Folder name contains invalid characters")
]

module.exports = validateFolder
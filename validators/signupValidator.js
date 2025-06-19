const {body} = require("express-validator")
const dbUser = require("../db/userQuery")

const validateUser = [
    body("username")
        .trim()
        .notEmpty()
        .withMessage("Username is required.")
        .isLength({ max: 20 })
        .withMessage("Username should be less than 20 characters long."),
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .withMessage("You should enter a valid email.")
        .custom(async (value) => {
            const isUsed = await dbUser.getUserByEmail(value)

            if (isUsed) {
                throw new Error("Email is already in use.")
            }

            return true;
        }),
    body("password")
        .trim()
        .notEmpty()
        .withMessage("Password is required.")
        .isLength({ min: 4, max: 16 })
        .withMessage("Password should be between 4 and 16 characters long.")
        .matches(/[A-Z]/)
        .withMessage("Password should contain at least an uppercase letter.")
        .matches(/[a-z]/)
        .withMessage("Password should contain at least a lowercase letter.")
        .matches(/\d/)
        .withMessage("Password should contain at least a digit."),
    body("confirmPassword")
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Passwords do not match.")
            }

            return true;
        })
]

module.exports = validateUser
const bcrypt = require("bcryptjs")
const dbUser = require("../db/userQuery")
const { validationResult } = require("express-validator")
const validateUser = require("../validators/signupValidator")

exports.signupGet = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect("/uploads")
    }

    res.render("signup")
}

exports.signupPost = [
    validateUser,
    async (req, res, next) => {
        const errors = validationResult(req)
        
        if (!errors.isEmpty()) {
            return res.status(400).render("signup", {
                oldInput: req.body,
                errors: errors.array()
            })
        }

        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
            if (err) {
                return next(err)
            }

            const { username, email } = req.body;

            try {
                await dbUser.createUser(username, email, hashedPassword)

                res.redirect("/")
            } catch(dbErr) {
                next(dbErr)
            }
        })
    }
]
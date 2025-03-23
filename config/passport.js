const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs")
const dbUser = require("../db/userQuery")

passport.use(
    new LocalStrategy(
        { usernameField: "email" },
        async (email, password, done) => {
            try {
                const user = await dbUser.getUserByEmail(email)

                if (!user) {
                    return done(null, false, { message: "Incorrect email" })
                }

                const match = await bcrypt.compare(password, user.password)

                if (!match) {
                    return done(null, false, { message: "Incorrect password"})
                }

                return done(null, user)
            } catch(err) {
                done(err)
            }
        }
    )
)

passport.serializeUser((user, done) => {
    done (null, user.id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await dbUser.getUserById(id)

        done(null, user)
    } catch(err) {
        done(err)
    }
})

module.exports = passport;
exports.logoutGet = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login")
    }

    req.logout((err) => {
        if (err) {
            return next(err)
        }

        res.redirect("/")
    })
}
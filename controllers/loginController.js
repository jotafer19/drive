const passport = require("../config/passport")

exports.loginGet = (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/")
    }

    res.render("login")
}

exports.loginPost = (req, res, next) => {
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/login",
      // failureFlash: "Incorrect email or password",
      failureFlash: true,
    })(req, res, next);
  };
const passport = require("../config/passport");

exports.loginGet = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/uploads");
  }

  res.render("login");
};

exports.loginPost = (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/uploads",
    failureRedirect: "/",
    failureFlash: "Incorrect email or password.",
  })(req, res, next);
};

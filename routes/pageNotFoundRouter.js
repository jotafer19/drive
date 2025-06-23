const { Router } = require("express");

const pageNotFoundRouter = Router();

pageNotFoundRouter.all("*", (req, res) => {
  const method = req.method;
  const isPost = method === "POST"

  res.status(404).render("404", {
    title: isPost ? "Invalid destination" : "Page not found",
    errorMessage: isPost
      ? "Request could not be completed: Invalid or unknown destination"
      : "Page not found",
  });
})

module.exports = pageNotFoundRouter;

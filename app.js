const express = require("express");
const path = require("node:path");
const expressSession = require("express-session");
const passport = require("./config/passport");
const flash = require("connect-flash");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient, Prisma } = require("@prisma/client");
require("dotenv").config();

const uploadsRouter = require("./routes/uploadsRouter");
const loginRouter = require("./routes/loginRouter");
const publicRouter = require("./routes/publicRouter")
const signupRouter = require("./routes/signupRouter");
const logoutRouter = require("./routes/logoutRouter");
const pageNotFoundRouter = require("./routes/pageNotFoundRouter");

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(flash());

app.use(
  expressSession({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    secret: process.env.SECRET_SESSION,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }),
);

app.use(passport.session());
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.flashMessage = req.flash();
  next();
});

app.use("/", loginRouter);
app.use("/uploads", uploadsRouter);
app.use("/signup", signupRouter);
app.use("/logout", logoutRouter);
app.use("/public", publicRouter)
app.use("*", pageNotFoundRouter);

app.use((err, req, res, next) => {
  const errMsg = err.message || "Oops! Something went wrong";
  res.status(err.status || 500).render("404", {
    title: errMsg,
    errorMessage: errMsg,
  });
});

app.listen(3000, () => console.log("Connected"));

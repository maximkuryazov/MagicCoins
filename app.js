const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const expressSession = require("express-session");

const Session = require("./session");

const app = express();

const credentials = require("./credentials.json");

app.use(cookieParser());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.set("trust proxy", 1); // trust first proxy
app.use(
  expressSession({
    secret: "qwerty",
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 64 /* days */ * 24 * 60 * 60 * 1000,
      httpOnly: false,
      domain: "*"
    }
  })
);

app.use(express.static("static"));

app.use(function requestHandler(req, res, next) {
  console.log("Request:", req.originalUrl);
  if (
    /* allow log-in */
    req.originalUrl === "/users" ||
    /* allow getting item types */
    req.originalUrl.startsWith("/items/") ||
    req.originalUrl.includes(`/video-reward/${credentials.secretLink}`)
  ) {
    next();
    return;
  }

  // Check for authorization.
  if (!req.headers.authorization) {
    res.status(401).json({
      error: true,
      description: "No credentials were sent!"
    });
  }

  const auth = req.headers.authorization.split(" ");
  if (auth[0] === "Bearer") {
    const bearer = auth[1];
    Session.findOne({
      where: {
        token: bearer
      }
    })
      .then(session => {
        req.session.token = bearer;
        req.session.user = session.user;

        next();
      })
      .catch(() => {
        res.status(401).json({
          error: true,
          description: `No active session was found: ${bearer}`
        });
      });
  } else {
    res.status(400).json({
      error: true,
      success: false,
      description: "Invalid authorization header supplied."
    });
  }
});

app.get("/", function getRoot(req, res) {
  res.send("Welcome to the Magic Coins server!");
});

/**
 * Let's Encrypt validation.
 */
app.get("/.well-known/acme-challenge/:xz", function validateLetsEncrypt(res) {
  res.send("This web-site is valid!");
});

module.exports = app;

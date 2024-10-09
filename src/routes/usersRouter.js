const express = require("express");
const router = express.Router();
const userService = require("../services/userService");
const jwt = require("jsonwebtoken");
const { passport, jwtOptions } = require("../jwtConfig");

router.post("/register", (req, res) => {
  const { email, password } = req.body; // object destructure
  userService
    .userCreate(email, password)
    .then((user) => {
      const nowInMs = new Date().getTime(); // milliseconds
      const expiresIn = 60 * 60; // seconds
      const token = jwt.sign(
        {
          _id: user._id,
          email: email,
          role: user.role ?? "guest",
          issuedAt: nowInMs,
          expiresIn,
        },
        jwtOptions.secretOrKey,
        { expiresIn }
      );

      console.log("token", token);
      res.status(201).json({ token, user });
    })
    .catch((error) => {
      console.error(error);
      res
        .status(500)
        .json({ message: "Failed to create/find user due to - " + error });
    });
});

router.post("/login", (req, res) => {
  // check email/passward-plain, if matches db's email/password-hash, then return a jwt: email, expireAt.
  const { email, password } = req.body; // object destructure
  userService
    .findByEmailPassword(email, password)
    .then((user) => {
      const nowInMs = new Date().getTime(); // milliseconds
      const expiresIn = 60 * 60; // seconds
      const token = jwt.sign(
        {
          _id: user._id,
          email: email,
          role: user.role ?? "guest",
          issuedAt: nowInMs,
          expiresIn,
        },
        jwtOptions.secretOrKey,
        { expiresIn }
      );

      console.log("token", token);
      res.status(200).json({ token, user });
    })
    .catch((error) => {
      console.error(error);
      res.status(404).json({ message: "Failed to login user - " + error });
    });
});

router.get(
  "/test-jwt",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      message: "jwt is valid",
      user: req.user,
    });
  }
);

module.exports = router;

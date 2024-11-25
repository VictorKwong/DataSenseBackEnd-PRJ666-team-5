//routes/userRouter.js
const express = require("express");
const router = express.Router();
const userService = require("../services/userService");
const jwt = require("jsonwebtoken");
const { passport, jwtOptions } = require("../jwtConfig");
const dotenv = require("dotenv");
const { OAuth2Client } = require("google-auth-library");

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function toToken(user) {
  const nowInMs = new Date().getTime(); // milliseconds
  const expiresIn = 60 * 60; // seconds
  const token = jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role ?? "guest",
      username: user.username,
      contact: user.contact,
      oauthProvider: user.oauthProvider,
      issuedAt: nowInMs,
      expiresIn,
    },
    jwtOptions.secretOrKey,
    { expiresIn }
  );
  return token;
}

async function verifyGoogleIdToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  console.log("## payload", payload);
  return payload;
}
// curl -X POST localhost:8080/upsertWithGoogleIdToken -H "Content-Type: application/json" -d "{\"idToken\": \"$idToken\"}"
router.post("/upsertWithGoogleIdToken", async (req, res) => {
  const googleIdToken = req.body.idToken;
  if (!googleIdToken) {
    return res.status(400).send("Token missing");
  }
  let userPayload;
  try {
    userPayload = await verifyGoogleIdToken(googleIdToken);
  } catch (tokenError) {
    return res.status(401).send("Unauthorized - " + tokenError);
  }

  try {
    const user = await userService.fetchOrCreateForOauth(
      userPayload.email,
      "google"
    );
    const token = toToken(user);
    res.status(201).json({ token, user });
  } catch (e) {
    console.error("Error fetching/creating user", e);
    return res.status(500).send("Internal error - " + e);
  }
});

router.post("/register", (req, res) => {
  const { email, password } = req.body; // object destructure
  userService
    .userCreate(email, password)
    .then((user) => {
      const token = toToken(user);
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
  console.log({ email, password });
  userService
    .findByEmailPassword(email, password)
    .then((user) => {
      const token = toToken(user);
      res.status(200).json({ token, user });
    })
    .catch((error) => {
      console.error(error);
      res.status(404).json({ message: "Failed to login user - " + error });
    });
});

router.post("/:id/set-password", async (req, res) => {
  const id = req.params.id;
  const { password, newPassword } = req.body;

  if (!id) {
    return res.status(400).json({ message: "id is missing" });
  }

  if (!newPassword) {
    return res.status(400).json({ message: "newPassword is missing" });
  }

  userService
    .setPassword(id, password, newPassword)
    .then((user) => {
      console.log("user updated ", user);
      res.status(200).json({ user });
    })
    .catch((err) => res.status(500).json({ message: `${err}` }));
});

// PUT /users/:id - Update user information
router.put("/:id/updateInfo", async (req, res) => {
  const { id } = req.params;
  const { username, contact } = req.body;

  // Validate request body
  if (!username && !contact) {
    return res.status(400).json({ message: "No fields to update" });
  }

  userService
    .updateInfo(id, username, contact)
    .then((user) => {
      const token = toToken(user);
      console.log("token", token);
      res.status(200).json({ token, user });
    })
    .catch((err) => res.status(500).json({ message: `${err}` }));
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

const passport = require("passport");
const passportJWT = require("passport-jwt");

// JSON Web Token Setup
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

// Configure its options
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"), // Bearer
  secretOrKey: "datasense-backend-secret",
};

const strategy = new JwtStrategy(jwtOptions, function (
  jwtPayloadDecoded,
  next
) {
  console.log("payload received", jwtPayloadDecoded); // de

  if (jwtPayloadDecoded) {
    // The following will ensure that all routes using
    // passport.authenticate have a req.user._id, req.user.email, req.user.fullName & req.user.role values
    // that matches the request payload data
    console.log("###### jwt payload", jwtPayloadDecoded);
    next(null, {
      // jwtPayloadDecoded present and valid.
      _id: jwtPayloadDecoded._id,
      email: jwtPayloadDecoded.email,
      role: jwtPayloadDecoded.role,
      issuedAt: jwtPayloadDecoded.issuedAt,
      expiresIn: jwtPayloadDecoded.expiresIn,
    });
  } else {
    next(null, false); // No jwtPayloadDecoded, either missing or invalid, then auth failed
  }
});

passport.use(strategy);

module.exports = {
  passport,
  jwtOptions,
};

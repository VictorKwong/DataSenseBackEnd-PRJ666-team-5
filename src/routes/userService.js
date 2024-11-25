//routes/userService.js
const bcrypt = require("bcryptjs");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// mongodb+srv://datasense-admin:DataSense-admin12345@cluster0.b3tukpp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
const uri =
  "mongodb+srv://Victor:7OkL03vI5PTE9FlJ@lentil.1fev0.mongodb.net/prj666_data_sense";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const connect = async () => {
  await client.connect();
  client
    .db("prj666_datasense")
    .collection("users")
    .createIndex({ email: 1 }, { unique: true });
};

// login with google account update
async function deleteUser(email) {
  const res = await client
    .db("prj666_datasense")
    .collection("users")
    .deleteOne({ email });
  console.log("deleted", res);
  return res;
}

async function fetchOrCreateForOauth(email, oauthProvider) {
  // validated google jwt
  const user = await client
    .db("prj666_datasense")
    .collection("users")
    .findOneAndUpdate(
      { email: email },
      { $set: { email: email, oauthProvider: oauthProvider } },
      { upsert: true, returnDocument: "after" }
    );
  console.log("upserted user", user);
  return user;
}

async function userCreate(email, password) {
  const hash = await bcrypt.hash(password, 10);
  await client
    .db("prj666_datasense")
    .collection("users")
    .insertOne({ email: email, password: hash });

  return await findByEmailPassword(email, password);
}

async function findByEmailPassword(email, plainPassword) {
  const user = await client
    .db("prj666_datasense")
    .collection("users")
    .findOne({ email: email });

  if (!user) {
    throw "User is not found";
  }
  if (!bcrypt.compareSync(plainPassword, user.password)) {
    throw "User email/password doesn't match";
  }
  delete user.password;
  return user;
}

async function setPassword(id, password, newPassword) {
  const userFindById = await client
    .db("prj666_datasense")
    .collection("users")
    .findOne({ _id: new ObjectId(id) });
  if (!userFindById) {
    throw "User not found";
  }

  if (!bcrypt.compareSync(password, userFindById.password)) {
    throw "Wrong current password.";
  }

  const hash = await bcrypt.hash(newPassword, 10);
  const user = await client
    .db("prj666_datasense")
    .collection("users")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { password: hash } },
      { returnDocument: "after", upsert: true }
    );
  if (user) {
    delete user.password;
  }
  return user;
}

async function updateInfo(id, username, contact) {
  const user = await client
    .db("prj666_datasense")
    .collection("users")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { username: username, contact: contact } },
      { returnDocument: "after", upsert: true }
    );
  if (user) {
    delete user.password;
  }
  return user;
}

module.exports = {
  connect,
  userCreate,
  findByEmailPassword,
  fetchOrCreateForOauth,
  deleteUser,
  setPassword,
  updateInfo,
};

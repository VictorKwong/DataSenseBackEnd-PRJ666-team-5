const bcrypt = require("bcryptjs");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://datasense-admin:DataSense-admin12345@cluster0.b3tukpp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
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
    .db("datasense")
    .collection("users")
    .createIndex({ email: 1 }, { unique: true });
};

async function userCreate(email, password) {
  const hash = await bcrypt.hash(password, 10);
  await client
    .db("datasense")
    .collection("users")
    .insertOne({ email: email, password: hash });

  return await findByEmailPassword(email, password);
}

async function findByEmailPassword(email, plainPassword) {
  const user = await client
    .db("datasense")
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

module.exports = {
  connect,
  userCreate,
  findByEmailPassword,
};

// connect mongodb
// if success, resolve
// otherwise, reject

//   const client2 = await client.connect();
//   console.log("client2", client2);
// get
//   const user = await client2
//     .db("datasense")
//     .collection("users")
//     .findOne({ _id: new ObjectId("66ff63ecc3499688729103af") });
// .findOne({ email: "test@email.com" });

// create
//   await client2
//     .db("datasense")
//     .collection("users")
//     .insertOne({ email: "test-insert@gmail.com", password: "new-pass-hash" })
//     .catch(console.error)
//     .then((res) => {
//       console.log("insert worked", res);
//     });

// update

//   const updateResult = await client
//     .db("datasense")
//     .collection("users")
//     .updateOne(
//       {
//         email: "test-insert@gmail.com",
//       },
//       { $set: { password: "new-pass-hash-updated" } }
//     );
//   console.log(updateResult);
//   return Promise.resolve();
//   await client2
//     .db("datasense")
//     .collection("users")
//     .insertOne({ email: "test-insert@gmail.com", password: "new-pass-hash" })
//     .catch(console.error)
//     .then((res) => {
//       console.log("insert worked", res);
//     });

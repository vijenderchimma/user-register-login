const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  let hashedPassword = await bcrypt.hash(password, 10);
  let selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  let dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    let createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`;
    if (password.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      let dbResponse = await db.run(createUserQuery);
      response.status = 200;
      response.send("User created successfully");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const isPasswordMatches = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatches === true) {
      response.status = 200;
      response.send("Log in success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status = 400;
    response.send("User Not registered");
  } else {
    isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPasswordMatched === true) {
      const newPasswordLength = newPassword.length;
      if (newPasswordLength < 5) {
        response.status = 400;
        response.send("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const createNewPasswordQuery = `
                UPDATE user
                SET
                password = '${encryptedPassword}'
                WHERE username = '${username}'
                `;
        await db.run(createNewPasswordQuery);
        response.status = 200;
        response.send("Password updated");
      }
    } else {
      response.status = 400;
      response.send("Invalid current password");
    }
  }
});

module.exports = app;

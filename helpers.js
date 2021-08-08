const bcrypt = require('bcrypt');

const getUserByEmail = function(email, database) {
  for (const user in database) {
    const userObj = database[user];
    if (userObj.email === email) {
      return userObj;
    }
  }
};

const authenticateUser = function(email, password, database) {
  const userFound = getUserByEmail(email,database);
  if (userFound && bcrypt.compareSync(password, userFound.password)) {
    return userFound;
  }
  return false;
};

const generateRandomString = function() {
  return Math.random().toString(16).substr(2, 6);
};

const getRandomID = function() {
  return Math.random().toString(16).substr(2, 6);
};

const addNewUser = function(email, password, users) {
  const id = getRandomID();
  const newUser = {
    id,
    email,
    password: bcrypt.hashSync(password, 10)
  };
  users[id] = newUser;
  // return {users, newUser};
  return id;
};

module.exports = { getUserByEmail ,
  generateRandomString,
  getRandomID,
  authenticateUser,
  addNewUser };
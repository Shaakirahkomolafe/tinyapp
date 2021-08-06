const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


const generateRandomString = function() {
 
  return Math.random().toString(16).substr(2, 6);
};
const getRandomID = function() {
  return Math.random().toString(16).substr(2, 6);
};

app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
  
};
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};
const urlsForUser = function(id) {
  let results = {};
  const keys = Object.keys(urlDatabase);
  for (const shortURL of keys) {
    const url = urlDatabase[shortURL];
    if (url.userID === id) {
      results[shortURL] = url.longURL;

    }
  }
  return results;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get('/urls.json', (req,res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b> World </b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


app.get("/urls",(req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    res.status(403).send('You have to login or register ');
  }
  const urls = urlsForUser(userId);
 
  const templateVars = {
    urls,
    user: users[userId]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  let userID = req.cookies.userId;
  urlDatabase[shortURL] = {longURL, userID};
  res.redirect(`/urls/${shortURL}`);         // Respond with 'Ok' (we will replace this)
});


app.get("/urls/new", (req,res) => {
  const userId = req.cookies.userId;

  const templateVars = {

    user: users[userId]
  //   // ... any other vars
  };
  if (!userId) {
    res.redirect('/login');
  }
  
  res.render("urls_new", templateVars);
});


// GET /urls/abcd

app.get("/urls/:shortURL", (req, res) => {

  let usersURL = urlDatabase[req.params.shortURL];
  
  const templateVars = { shortURL: req.params.shortURL,
    longURL: usersURL.longURL,
    user: users[usersURL.userID]
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  // const longURL = ..
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  
  let newURL = req.body.editURL; // new long URL
  let shortURL = req.params['id'];
  urlDatabase[shortURL].longURL = newURL;

  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  // i want to go through the database(users) to go through the keys to check if this email value and password value exists
  for (let user in users) {
  
    if (users[user].email === userEmail && bcrypt.compareSync(users[user].password,  userPassword)) {
      res.cookie('userId', user);
      res.redirect('/urls');
    }
  }
  res.status(403).send('Email or password incorrect');
  
});

app.get("/login", (req, res) => {
  const userId = req.cookies.userId;
  const templateVars = {
    user: users[userId]
  };
  res.render('login', templateVars);
});

app.post("/logout", (req,res) => {
  const userId = req.cookies.userId;
  const templateVars = {
    user: users[userId]
  };
  res.clearCookie("userId");
  res.redirect("/urls");
});

app.get("/register", (req,res) => {
  const id = req.cookies['user_id'];
  const user = users[id];
  if (user) {
    res.redirect('/urls');
  }

  res.render('register', user);
});

app.post("/register", (req, res) => {
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password,10);

  for (let userId in users) {
    if (users[userId].email === req.body.email) {
      return res.sendStatus(400);
    }
  }
  if (req.body.email === '' || password === '') {
    return res.status(400).send('Please type in a valid email and password');
  }
  const userObject = {
    id: getRandomID(),
    email: req.body.email,
    password: hashedPassword
  };
  users[userObject.id] = userObject;
  res.cookie('userId', userObject.id);

  res.redirect('/urls');
});
const express = require("express");
const app = express();
const { getUserByEmail, generateRandomString, authenticateUser, addNewUser} = require('./helpers');
const cookieSession = require('cookie-session');
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1'/* secret keys */],
}));

app.set("view engine", "ejs");

/*  database for url created*/
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

/* database for users */
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

/* to make sure that the urls displayed is for  for each user */
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

/* homepage, if user is logged in, redirect to urls page, if not, redirect to login or register */
app.get("/", (req, res) => {
  const userId = req.session['userId'];
  if (!userId) {
    return res.redirect('/login');
  }
  return res.redirect('/urls');
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

/* Urls page, if user is logged in, show them their urls and have access to create or edit, if not ask to login or register*/
app.get("/urls",(req, res) => {
  const userId = req.session['userId'];
  if (!userId) {
    return res.redirect('/login');
  }
  const urls = urlsForUser(userId);
  const templateVars = {
    urls,
    user: users[userId]
  };
  res.render("urls_index", templateVars);
});

/* redirects to newly created shortUrl*/
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  let userID = req.session['userId'];
  urlDatabase[shortURL] = {longURL, userID};
  return res.redirect(`/urls/${shortURL}`);
});

/* new  urls display*/
app.get("/urls/new", (req,res) => {
  const userId = req.session['userId'];
  const templateVars = {
    user: users[userId]
  };
  if (!userId) {
    return res.redirect('/login');
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session['userId'];
  let usersURL = urlDatabase[req.params.shortURL];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: usersURL.longURL,
    user: users[usersURL.userID]
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  return res.redirect(longURL);
});


/* deletes url*/
app.post('/urls/:shortURL/delete', (req, res) => {
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  return res.redirect('/urls');
});


app.post("/urls/:id", (req, res) => {
  console.log('+++++++', req.session);
  console.log('>>>>>>>', users);
  const userId = req.session['userId'];
  let newURL = req.body.editURL;
  let shortURL = req.params['id'];
  urlDatabase[shortURL].longURL = newURL;
  const ownerID = urlDatabase[shortURL].userID;
  if (userId !== ownerID) {
    return res.status(403).send('Forbidden operation');
  }
  return res.redirect('/urls');
});

/* if the  user exists in the database, succesfully login, if  information is incorrect, ask to enter correct one*/
app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const userFound = authenticateUser(userEmail, userPassword, users);
  if (userFound) {
    req.session['userId'] = userFound.id;
    return res.redirect('/urls');
  } else {
    res.status(403).send('Email or password incorrect');
  }
});

/* getting the login page to render */
app.get("/login", (req, res) => {
  const userId = req.session['userId'];
  const templateVars = {
    user: users[userId]
  };
  res.render('login', templateVars);
});

/* logout successfully and clear session cookies */
app.post("/logout", (req,res) => {
  req.session = null;
  return res.redirect("/urls");
});

/* registration, if a user succesfully registers redirect to urls */
app.get("/register", (req,res) => {
  const id = req.session['userId'];
  const user = users[id];
  if (user) {
    return res.redirect('/urls');
  }
  res.render('register', user);
});

/* checks registration to see if user already exists or not, if yes, ask use another email, if no, add to database */
app.post("/register", (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  const userFound = getUserByEmail(email, users);
  if (!userFound) {
    const userId = addNewUser(email, password, users);
    req.session['userId'] = userId;
    return res.redirect('/urls');
  } else {
    res.status(400).send('email already in use');
  }
});
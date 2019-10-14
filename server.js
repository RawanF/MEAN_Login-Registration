const express = require("express");
const mongoose = require('mongoose');
var session = require('express-session')
const flash = require('express-flash');
const bcrypt = require('bcrypt');
mongoose.connect('mongodb://localhost/UserInfoDB', { useNewUrlParser: true });
const UserSchema = new mongoose.Schema({
    Fname: { type: String, required: [true, "First Name can not be empty"], minlength: [3, "First Name must be at least 3 charachters"] },
    Lname: { type: String, required: [true, "Last Name can not be empty"], minlength: [3, "Last Name must be at least 3 charachters"] },
    email: { type: String, required: [true, "email can not be empty"], minlength: [3, "email must at least be 3 charachters"], unique: [true, "Email already exiest try to login"] },
    BDate: { type: String, required: [true, "Birthday can not be empty"] },
    password: { type: String, required: [true, "password can not be empty"], minlength: [3, "Password must be at least 3 charachters"] }

}, { timestamps: true });
const User = mongoose.model('User', UserSchema);
const app = express();
app.use(session({
    secret: 'keyboardkitteh',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}))
app.use(flash());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render("./index");
});
app.get('/Dashboard', (req, res) => {
    res.render("./Dashboard");
});

app.post('/Login', (req, res) => {  //action for Login form 
    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) {
            console.log("We have an error!", err);
            for (var key in err.errors) {
                req.flash('LoginErr', err.errors[key].message);
            }
            res.redirect('/');
        }
        else {
            if (user == null) {
                console.log("user Not Found")
                res.redirect('/');
            }
            else {
                console.log(user)
                bcrypt.compare(req.body.password, user.password)
                    .then(result => {
                        if (result) {
                            console.log("Found it")
                            req.session.user_id = user._id;
                            console.log("ID in session", req.session.user_id)
                            req.session.email = user.email;
                            console.log("email in session", req.session.email)
                            req.session.logged = true;
                            console.log("Logged:", req.session.logged)
                            res.redirect('/Dashboard');
                        }
                        else {
                            console.log("Wrong pass")
                            res.redirect('/');
                        }
                    })
                    .catch(err => {
                        console.log("We have an error while compare !", err);
                        for (var key in err.errors) {
                            req.flash('LoginErr', err.errors[key].message);
                        }
                        res.redirect('/');
                    })
            }
        }
    })
});


app.post('/Registration', (req, res) => {  //action for Registration form 
    const u = new User();
    u.Fname = req.body.Fname;
    u.Lname = req.body.Lname;
    u.email = req.body.email;
    u.BDate = req.body.BDate;
    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) {
            console.log("We have an error!", err);
            for (var key in err.errors) {
                req.flash('RegistrationErr', err.errors[key].message);
            }
            res.redirect('/');
        }
        else {
            if (user == null) {//no user with this email
                // BDate=new Date("<YYYY-mm-dd>");
                console.log(req.body.password)
                bcrypt.hash(req.body.password, 10)
                    .then(hashed_password => {
                        // console.log(hashed_password)
                        u.password = hashed_password;
                        u.save()// inserts the data into the database then returns a promise
                            .then(newUserData => {
                                console.log('User Created: ', newUserData)
                                req.session.user_id = u._id;
                                console.log("ID in session", req.session.user_id)
                                req.session.email = u.email;
                                console.log("email in session", req.session.email)
                                req.session.logged = true;
                                console.log("Logged:", req.session.logged)
                                res.redirect('/Dashboard');
                            })
                            .catch(err => {
                                console.log("We have an error!", err);
                                for (var key in err.errors) {
                                    req.flash('RegistrationErr', err.errors[key].message);
                                }
                                res.redirect('/');
                            });

                    })
                    .catch(error => {
                        console.log("can not hash password", error)
                    });
            }
            else {
                console.log("user already exiest try to login")
                req.session.message="user already exiest try to login";
                res.redirect('/');
            }
        }
    });
});
app.use(function(req, res, next) {
    res.locals.message = req.session.message;
    next();
  });
app.use(express.static(__dirname + "/static"));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.listen(8000, () => console.log("listening on port 8000")); 
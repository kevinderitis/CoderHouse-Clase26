const express = require('express')
const exphbs = require('express-handlebars');
const session = require('express-session')
const mongoose = require('mongoose');
const { usuarioModel } = require('./models/usuario');

/* ------------------ Mongo -------------------- */

connect()
async function connect(){
    try{
        const url = 'mongodb://localhost:27017/facebook';
        let rta = await mongoose.connect(url);
        console.log('Base de datos conectada');
    }catch(err){
        console.log(err)
    }
}

/* ------------------ PASSPORT -------------------- */
const passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

const FACEBOOK_CLIENT_ID = '1015496119051870';
const FACEBOOK_CLIENT_SECRET = '687295be11156546305992b9198ccd62';

async function validateMail(emailRecibido){
    let user = await usuarioModel.find({ email: emailRecibido })
    return user[0].email === emailRecibido;
};

passport.use(new FacebookStrategy({
    clientID: FACEBOOK_CLIENT_ID,
    clientSecret: FACEBOOK_CLIENT_SECRET,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'photos', 'emails'],
    scope: ['email']
}, function (accessToken, refreshToken, profile, done) {
    if(validateMail(profile.emails[0].value)){
        console.log(profile)
        let userProfile = profile;
        return done(null, userProfile);
    }else{
        return done(null, null);
    }
}));

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});
/* ------------------------------------------------ */

const app = express()
app.use(session({
    secret: 'shhhhhhhhhhhhhhhhhhhhh',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60000
    }
}))

/* ------------------ PASSPORT -------------------- */
app.use(passport.initialize());
app.use(passport.session());
/* ------------------------------------------------ */
app.engine('.hbs', exphbs({ extname: '.hbs', defaultLayout: 'main.hbs' }));
app.set('view engine', '.hbs');
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/datos')
    }
    else {
        res.redirect('/login')
    }
})

/* --------- LOGIN ---------- */
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html')
})

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback', passport.authenticate('facebook',
    {
        successRedirect: '/',
        failureRedirect: '/register'
    }
));

app.get('/faillogin', (req, res) => {
    res.render('login-error', {});
})

app.get('/register', (req, res) => {
    res.render('login-error', {});
})

/* --------- DATOS ---------- */
app.get('/datos', (req, res) => {
    if (req.isAuthenticated()) {
        //reinicio contador
        if (!req.user.contador) req.user.contador = 0
        req.user.contador++
        res.render('datos', {
            nombre: req.user.displayName,
            foto: req.user.photos[0].value,
            email: req.user.emails[0].value,
            contador: req.user.contador
        });
    }
    else {
        res.redirect('/login')
    }
})

/* --------- LOGOUT ---------- */
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/')
})


const PORT = 8080
const server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`)
})
server.on("error", error => console.log(`Error en servidor: ${error}`))

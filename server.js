const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const User = require('./models/User');

const app = express();
const port = 3000;

mongoose.connect('mongodb://localhost/authApp');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/inscription', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const user = new User({ username, email, password });
        await user.save();
        req.session.userId = user._id;
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

app.post('/connexion', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (user) {
            req.session.userId = user._id;
            res.redirect('/dashboard');
        } else {
            res.redirect('/');
        }
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/user', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send({ error: 'Non autorisé' });
    }
    try {
        const user = await User.findById(req.session.userId);
        res.send({ username: user.username });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Erreur serveur' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

app.listen(port, () => {
    console.log(`Le serveur tourne sur http://localhost:${port}`);
});

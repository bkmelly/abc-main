const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser'); 
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbconn = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'project 100'
});

const app = express();

// Middleware application
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Authorization middleware
app.use((req, res, next) => {
    const privateRoutes = ["/clients", "/dashboard"];
    const adminRoutes = ["/projects", "/admin"];
    if (req.session && req.session.user) {
        res.locals.user = req.session.user;
        if (req.session.user.email !== process.env.ADMIN_EMAIL && adminRoutes.includes(req.path)) {
            res.status(401).send("Unauthorized Access. Only admins allowed.");
        } else {
            next();
        }
    } else if (privateRoutes.includes(req.path) || adminRoutes.includes(req.path)) {
        res.status(401).send("Unauthorized Access. Login First");
    } else {
        next();
    }
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        res.redirect('/signin');
    }
};

// Routes
app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/about', (req, res) => {
    res.render('about.ejs');
});

app.get('/faq', (req, res) => {
    res.render('faq.ejs');
});

app.get('/blogs', (req, res) => {
    res.render('blogs.ejs');
});

app.get('/feature', (req, res) => {
    res.render('feature.ejs');
});

app.get('/pricing', (req, res) => {
    res.render('pricing.ejs');
});

app.get('/team', (req, res) => {
    res.render('team.ejs');
});

app.get('/testimonials', (req, res) => {
    res.render('testimonials.ejs');
});

app.get('/coming', (req, res) => {
    res.render('coming.ejs');
});

app.get('/contact', (req, res) => {
    res.render('contact.ejs');
});

app.get('/404', (req, res) => {
    res.render('404.ejs');
});

app.get('/signin', (req, res) => {
    res.render('sign.up.in.ejs');
});

app.get('/Kitchen', (req, res) => {
    res.render('multistep.ejs');
});
app.get('/check-out', (req, res) => {
    res.render('check-out.ejs');
});
app.get('/GetStarted', (req, res) => {
    res.render('getstarted.ejs');
});
app.get('/Web-Mistakes', (req, res) => {
    res.render('blog-1(Hero).ejs');
});

// Form submission and authentication route
app.post('/submit-code', (req, res) => {
    const { name, code } = req.body;

    const selectQuery = 'SELECT * FROM clcompanyinfo WHERE name = ?';
    dbconn.query(selectQuery, [name], (err, results) => {
        if (err) {
            console.error('Database Error on SELECT:', err);
            res.status(500).send('Server Error on SELECT');
        } else if (results.length === 0) {
            res.status(400).send('Name not found');
        } else if (results[0].features) {
            res.status(400).send('Name already authenticated');
        } else {
            const updateQuery = 'UPDATE clcompanyinfo SET features = ? WHERE name = ?';
            dbconn.query(updateQuery, [code, name], (updateErr) => {
                if (updateErr) {
                    console.error('Database Error on UPDATE:', updateErr);
                    res.status(500).send('Server Error on UPDATE');
                } else {
                    res.send('Success');
                }
            });
        }
    });
});

// Sign-up route
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    dbconn.query('SELECT email FROM Users WHERE email = ?', [email], (err, result) => {
        if (err) {
            res.status(500).send('Server Error');
        } else if (result.length > 0) {
            res.render('sign.up.in.ejs', { error: "Email already in use. Sign Up" });
        } else {
            const hashedPassword = bcrypt.hashSync(password, 10);
            dbconn.query('INSERT INTO Users (username, password, email, role, dateJoined) VALUES (?, ?, ?, ?, NOW())', [username, hashedPassword, email, 'client'], (error) => {
                if (error) {
                    res.status(500).send('Server Error');
                    console.log(error);
                } else {
                    res.send('<script>alert("Sign up successful!"); window.location.href = "/blogs";</script>');
                }
            });
        }
    });
});

// Sign-in route
app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    dbconn.query('SELECT * FROM Users WHERE email = ?', [email], (error, users) => {
        if (error) {
            res.status(500).send('Server Error');
        } else if (users.length === 0) {
            res.render('sign.up.in.html', { error: "Email not registered. Sign Up" });
        } else {
            const user = users[0];
            const passwordMatch = bcrypt.compareSync(password, user.password);
            if (passwordMatch) {
                req.session.user = user;
                res.redirect('/blogs');
            } else {
                res.render('sign.up.in.html', { error: "Incorrect password. Try again." });
            }
        }
    });
});

// Multistep form submission route
app.post('/Kitchen', (req, res) => {
    const { name, companyName, email, phone_number, industry, businessdescription, brandColors, Products, features, uniqueBenefits } = req.body;

    const sql = 'INSERT INTO clcompanyinfo (name, companyName, email, phone_number, industry, businessdescription, brandColors, Products, features, uniqueBenefits) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [name, companyName, email, phone_number, industry, businessdescription, brandColors, Products, features, uniqueBenefits];

    dbconn.query(sql, values, (error) => {
        if (error) {
            console.error('Database Error:', error);
            res.status(500).send('Server Error');
        } else {
            res.send('<script>alert("Form submission successful!"); window.location.href = "/blogs";</script>');
        }
    });
});

// Newsletter subscription route
app.post('/subscribe', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send('Email is required');
    }

    const sql = 'INSERT INTO newslettersubscribers (email) VALUES (?)';
    dbconn.query(sql, [email], (error, results) => {
        if (error) {
            console.error('Database Error:', error);
            return res.status(500).send('Server Error');
        }
        res.send('Subscription successful');
    });
});

// Client dashboard
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard.ejs', { user: req.session.user });
});

// Admin and authenticated routes
app.get('/clients', isAuthenticated, (req, res) => {
    dbconn.query('SELECT * FROM Clients', (err, clients) => {
        if (err) {
            res.status(500).send('Error occurred');
        } else {
            res.render('clients.ejs', { clients });
        }
    });
});

app.get('/projects', isAuthenticated, (req, res) => {
    dbconn.query('SELECT * FROM Projects', (err, projects) => {
        if (err) {
            res.status(500).send('Error occurred');
        } else {
            res.render('projects.ejs', { projects });
        }
    });
});

app.get('/admin', isAuthenticated, (req, res) => {
    res.render('admin.ejs');
});

app.post("/data", (req,res)=>{
    console.log(req.body);
    // fs - iframe

    // crreate ejs files --- iframesssse4
    res.redirect("/page?id=uguthgfgf")
}
)

// Listen on the port provided by Heroku or 7000 for local development
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

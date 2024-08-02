const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser'); 
const path = require('path');

const dbconn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'project 100' // Update to your database name if different
});

const app = express();

// Middleware application
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using https
}));

// Authorization middleware
app.use((req, res, next) => {
    const privateRoutes = ["/clients", "/dashboard"];
    const adminRoutes = ["/projects", "/admin"];
    if (req.session && req.session.user) {
        res.locals.user = req.session.user;
        if (req.session.user.email !== "benaiahlagat24@gmail.com" && adminRoutes.includes(req.path)) { // Replace with actual admin email
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
    res.render('index.html');
});

app.get('/about', (req, res) => {
    res.render('about.html');
});

app.get('/faq', (req, res) => {
    res.render('faq.html');
});

app.get('/blogs', (req, res) => {
    res.render('blogs.html');
});

app.get('/feature', (req, res) => {
    res.render('feature.html');
});

app.get('/pricing', (req, res) => {
    res.render('pricing.html');
});

app.get('/team', (req, res) => {
    res.render('team.html');
});

app.get('/testimonials', (req, res) => {
    res.render('testimonials.html');
});

app.get('/coming', (req, res) => {
    res.render('coming.html');
});

app.get('/contact', (req, res) => {
    res.render('contact.html');
});

app.get('/404', (req, res) => {
    res.render('404.html');
});

app.get('/signin', (req, res) => {
    res.render('sign.up.in.ejs');
});

app.get('/Kitchen', (req, res) => {
    res.render('multistep.html');
});
app.get('/check-out', (req, res) => {
    res.render('check-out.html');
});

// Form submission and authentication route
// Route for handling form submission
app.post('/submit-code', (req, res) => {
    const { name, code } = req.body;

    // Check if the 'name' exists in the 'clcompanyinfo' table
    const selectQuery = 'SELECT * FROM clcompanyinfo WHERE name = ?';
    dbconn.query(selectQuery, [name], (err, results) => {
        if (err) {
            console.error('Database Error on SELECT:', err);
            res.status(500).send('Server Error on SELECT');
        } else if (results.length === 0) {
            res.status(400).send('Name not found');
        } else if (results[0].features) {
            // Check if 'features' column is already populated
            res.status(400).send('Name already authenticated');
        } else {
            // Update the 'features' column with the new 'code'
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
            console.error('Database Error:', error); // Log the error
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

app.listen(7000, () => {
    console.log('Server is running on port 7000');
});

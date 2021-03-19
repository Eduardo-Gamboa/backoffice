// 1 - Invocamos a Express
const express = require('express');
const app = express();

// 2 - Para poder capturar los datos del formulario (sin urlencoded nos devuelve "undefined")
app.use(express.urlencoded({ extended: false }));
app.use(express.json());//además le decimos a express que vamos a usar json

// 3- Invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './env/.env'});

// 4 -seteamos el directorio de assets
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

// 5 - Establecemos el motor de plantillas
app.set('view engine', 'ejs');

// 6 -Invocamos a bcrypt
const bcrypt = require('bcryptjs');

//7- variables de session
const session = require('express-session');
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

// 8 - Invocamos a la conexion de la DB
const connection = require('./database/db');

//9 - establecemos las rutas
app.get('/login', (req, res) => {
	res.render('login');
});

app.get('/register', (req, res) => {
	res.render('register');
});

app.get('/home', (req, res) => {
	if (req.session.loggedin) {
		res.render('home', {
			login: true,
			name: req.session.name,
			res2: res
		});
	} else {
		res.render('home', {
			login: false,
			name: 'Debe iniciar sesión',
		});
	}
	res.end();
});

//10 - Método para la REGISTRACIÓN
app.post('/register', async (req, res) => {
	const user = req.body.user;
	const name = req.body.name;
	const rol = req.body.rol;
	const pass = req.body.pass;
	let passwordHash = await bcrypt.hash(pass, 8);
	connection.query('INSERT INTO users SET ?', { user: user, name: name, rol: rol, pass: passwordHash }, async (error, results) => {
		if (error) {
			console.log(error);
		} else {
			res.render('register', {
				alert: true,
				alertTitle: "Registration",
				alertMessage: "¡Successful Registration!",
				alertIcon: 'success',
				showConfirmButton: false,
				timer: 1500,
				ruta: ''
			});
			//res.redirect('/');         
		}
	});
})

//11 - Metodo para la autenticacion
app.post('/auth', async (req, res) => {
	const user = req.body.user;
	const pass = req.body.pass;
	//let passwordHash = await bcrypt.hash(pass, 8);
	if (user && pass) {
		connection.query('SELECT * FROM users WHERE username = ?', [user], async (error, results, fields) => {
			//|| !(await bcrypt.compare(pass, results[0].pass))
			if (results.length === 0 || pass != results[0].password) {

				//Mensaje simple y poco vistoso
				//res.send('Incorrect Username and/or Password!');
				res.render('login', {
					alert: true,
					alertTitle: "Error",
					alertMessage: "USUARIO y/o PASSWORD incorrectas",
					alertIcon: 'error',
					showConfirmButton: true,
					timer: false,
					ruta: 'login'
				});
			}else if(results[0].tipo === "admin"){
				//creamos una var de session y le asignamos true si INICIO SESSION       
				req.session.loggedin = true;
				req.session.name = results[0].username;
				req.session.keys = results[0].password;
				// req.session.user = results[0].username;
				res.render('login', {
					alert: true,
					alertTitle: "Conexión exitosa",
					alertMessage: "¡LOGIN CORRECTO!",
					alertIcon: 'success',
					showConfirmButton: false,
					timer: 1200,
					ruta: 'admin'
				});
			} 
			else if(results[0].tipo === "usuario"){
				//creamos una var de session y le asignamos true si INICIO SESSION       
				req.session.loggedin = true;
				req.session.name = results[0].username;
				req.session.keys = results[0].password;
				// req.session.user = results[0].username;
				res.render('login', {
					alert: true,
					alertTitle: "Conexión exitosa",
					alertMessage: "¡LOGIN CORRECTO!",
					alertIcon: 'success',
					showConfirmButton: false,
					timer: 1200,
					ruta: 'profile'
				});
			}
			res.end();
		});
		
	} else {
		res.send('Please enter user and Password!');
		res.end();
	}
});

//12 - Método para controlar que está auth en todas las páginas
app.get('/profile', (req, res) => {
	const user = req.session.name;
	const pass = req.session.keys;
	console.log(req.session.keys);
	connection.query('SELECT * FROM users WHERE username = ?', [user], (error, results, fields) => {
		if (results[0] === undefined){
			res.render('index', {
				login: false,
				name: 'Debe iniciar sesión',
			});
		}else if(pass != results[0].password){

		}else{
			if (req.session.loggedin) {
				console.log(results[0].inicio);
				res.render('index', {
					login: true,
					username: req.session.name,
					fullname: results[0].fullname,
					pass: results[0].password,
					inicio: results[0].inicio,
					fotos: results[0].fotos,
					ilustraciones: results[0].ilustraciones,
					mesa: results[0].mesa,
					videojuegos: results[0].videojuegos
				});
			} else {
				res.render('index', {
					login: false,
					name: 'Debe iniciar sesión',
				});
			}
			res.end();
		}
	});
});

app.get('/admin', (req, res) => {
	const user = req.session.name;
	const pass = req.session.keys;
	connection.query('SELECT * FROM users WHERE username = ?', [user], (error, results, fields) => {
		if (results[0] === undefined){
			res.render('index', {
				login: false,
				name: 'Debe iniciar sesión',
			});
		}else if (pass != results[0].password){
			
		}else{
			if (req.session.loggedin) {
				res.render('admin', {
					login: true,
					username: req.session.name,
					fullname: results[0].fullname,
					pass: results[0].password 
				});
			} else {
				res.render('admin', {
					login: false,
					name: 'Debe iniciar sesión',
				});
			}
			res.end();
		}
	});
});

// app.get('/admin', (req, res) => {
// 	if (req.session.loggedin) {
// 		res.render('admin', {
// 			login: true,
// 			name: req.session.name
// 		});
// 	} else {
// 		res.render('admin', {
// 			login: false,
// 			name: 'Debe iniciar sesión',
// 		});
// 	}
// 	res.end();
// });

//función para limpiar la caché luego del logout
app.use(function (req, res, next) {
	if (!req.user)
		res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	next();
});

//Logout
//Destruye la sesión.
app.get('/logout', function (req, res) {
	req.session.destroy(() => {
		res.redirect('/home'); // siempre se ejecutará después de que se destruya la sesión
	})
});

app.listen(3000, (req, res) => {
	console.log('SERVER RUNNING IN http://localhost:3000');
});
const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');

const app = express();
app.use(session({ secret: 'ssshhhhh', resave: false, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

const hbs = exphbs.create({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    extname: '.handlebars'
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Conexão com o banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academicmanager'
});

db.connect((err) => {
    if (err) {
        console.log('Erro ao conectar banco de dados', err);
        return;
    }
    console.log('Conexão estabilizada!');
});

// Rota do login
app.get('/', (req, res) => {
    req.session.destroy();
    res.render('login', { message: '', showMenu: false });
});

app.post('/log', (req, res) => {
    var email = req.body.email;
    var pass = req.body.pass;

    var query = 'SELECT * FROM professores WHERE email = ? AND pass = ?';
    db.query(query, [email, pass], function (err, results) {
        if (err) {
            console.error('Erro na consulta:', err);
            res.render('login', { message: 'Erro interno.' });
            return;
        }

        if (results.length > 0) {
            req.session.user = results[0];
            var role = results[0].role;
            var userId = results[0].id;

            switch (role) {
                case 'admin':
                    res.redirect('/admin/' + userId);
                    break;
                // Adicione outros casos conforme necessário
                default:
                    res.render('error', { message: 'Tipo de usuário não reconhecido.' });
            }
        } else {
            res.render('login', { message: 'Login incorreto!' });
        }
    });
});

// Rota do Admin
app.get('/admin/:id', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin', { user: req.session.user, showMenu: true });
    } else {
        res.redirect('/');
    }
});

// Rota para visualizar todos os usuários
app.get('/users', (req, res) => {
    const query = 'SELECT * FROM professores';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao buscar usuários' });
        }
        res.json(results);
    });
});

// Rota para adicionar um novo usuário
app.post('/users/add', (req, res) => {
    const { nome, email, senha, role } = req.body;
    
    const userQuery = 'INSERT INTO professores (email, pass, role) VALUES (?, ?, ?)';
    
    db.query(userQuery, [email, senha, role], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao adicionar usuário' });
        }
        res.json({ success: true, message: 'Usuário adicionado com sucesso!' });
    });
});

// Rota para editar um usuário
app.post('/users/edit', (req, res) => {
    const { id, nome, email, senha, role } = req.body;
    
    const userQuery = 'UPDATE professores SET email = ?, pass = ?, role = ? WHERE id = ?';

    db.query(userQuery, [email, senha, role, id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao editar usuário' });
        }
        res.json({ success: true, message: 'Usuário editado com sucesso!' });
    });
});

// Rota para deletar um usuário
app.post('/users/delete', (req, res) => {
    const { id } = req.body;

    const deleteUserQuery = 'DELETE FROM professores WHERE id = ?';

    db.query(deleteUserQuery, [id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao excluir usuário' });
        }
        res.json({ success: true, message: 'Usuário excluído com sucesso!' });
    });
});

app.listen(8081, () => console.log('Servidor Ativo!'));
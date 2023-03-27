const express = require('express');
const app = express();
const port = 3000;
const router = require('./routes/routes');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');

app.use(express.json());
app.use(cookieParser());
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('static'));
app.use(router);

app.use('/vendor', express.static(__dirname + '/frontend/vendor'));
app.use('/css', express.static(__dirname + '/frontend/css'));
app.use('/images', express.static(__dirname + '/frontend/images'));
app.use('/fonts', express.static(__dirname + '/frontend/fonts'));
app.use('/js', express.static(__dirname + '/frontend/js'));
app.use('/media', express.static(__dirname + '/frontend/media'));
app.set('views', './frontend')
app.set('view engine', 'ejs');

app.listen(port, () => console.log(`Example app listening on port ${port}!`)
);
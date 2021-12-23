const lcl = require('cli-color'),
    compression = require('compression'),
    cors = require('cors'),
    morgan = require('morgan'),
    bodyParser = require("body-parser"),
    express = require('express');

// global express
const app = express();

// express middlewares
app.use(compression());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// express routes
app.use('/api', require('./api/router'));

// express error handler
app.use((req, res, next) => {
    const error = new Error("Page not found");
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        "success": false,
        "message": error.message,
    });
});


// start express server
const port = process.env.PORT || 3000;
app.listen(port, async function () {
    console.log(lcl.blue("[Express - Info]"), "Started on port", lcl.yellow(port));
});
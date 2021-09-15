const express = require("express");
const { config } = require('dotenv'); 
const mongoose = require("mongoose")
const router = require("./routers/userRouter.js");
const cookie_parser = require('cookie-parser')
const handleErrors = require('./middleware/handleErrors');

config();

const PORT = process.env.PORT || 5000;
const app = express();
const url = process.env.URL;
 
app.use(express.json());
app.use(cookie_parser(process.env.SECRET_KEY));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use(handleErrors);

async function start() {
    try {
        await mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        });
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    } catch (e) {
        console.log(e);
    }
}

start();

module.export = app;
const express = require('express')
const fileUpload = require('express-fileupload');
const cors = require('cors')
const fs = require('fs');
const fastcsv = require("fast-csv");
const mysql = require('mysql2');
const app = express()
var bodyParser = require('body-parser')
const port = 3001
const inventory = require('./inventory.json')
const csvParser = require('csv-parse');
const multer = require('multer');
const res = require('express/lib/response');
const { Exception } = require('sass');

const host = 'localhost'
const user = "root"
const password = "glory51330"
const database = "node-database"

app.use(cors(), bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['file/csv']
    if (!allowedTypes.includes(file.mimetype)) {
        const error = new Error("Incorrect file!");
        error.code = "INCORRECT_FILETYPE";
        return cb(error, false)
    }
    cb(null, true)
}
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads')
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}--${file.originalname}`)
    },
    fileFilter,
});

const upload = multer({ storage: fileStorage })

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "glory51330",
    database: 'node-database',
});

con.connect(function (err) {
    if (err) {
        return console.error('error: ' + err.message);
    }

    console.log('Connected to the MySQL server.');
});





con.query("SELECT * FROM articles", function (err, result) {
    if (err) throw err;
});

// con.query("INSERT INTO articles (`title`, `description`, `price`, `currency`, `brand`) VALUES ('dzad','1',1,'€','coucou')", function (err, result) {
//     if (err) throw err;
//     console.log("1 record inserted");
// });


app.get('/', (req, res) => res.json(inventory))

app.get('/articles', (req, res) => {
    con.query("SELECT * FROM articles", function (err, result) {
        if (err) throw err;
        // console.log(JSON.stringify(result));
        res.json(result)
    });
})

app.post('/uploads', upload.single('uploaded_file'), (req, res) => {
    res.json({ file: req.file })
    const csv_file_path = `/Users/nier/Sites/NodeJS/${req.file.path}`
    console.log(csv_file_path);

    let stream = fs.createReadStream(csv_file_path);

    let csvData = [];
    let csvStream = fastcsv.
        parse({
            delimiter: ';'
        })
        .on("data", function (data) {
            csvData.push(data);
        })
        .on("end", function () {
            csvData.shift();
            console.log(csvData);
            const connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                password: "glory51330",
                database: "node-database"
            });
            connection.connect(error => {
                if (error) {
                    console.error(error);
                } else {
                    let query = "INSERT INTO `articles`(`title`, `description`, `price`, `currency`, `brand`) VALUES ?";
                    connection.query(query, [csvData], (error, response) => {
                        console.log(error || response);
                    });
                }
            });
        })
        
        stream.pipe(csvStream);
        fs.stat(csv_file_path, function (err, stats) {
            console.log(stats);//here we got all information of file in stats variable
         
            if (err) {
                return console.error(err);
            }
         
            fs.unlinkSync(csv_file_path,function(err){
                 if(err) return console.log(err);
                 console.log('file deleted successfully');
            });  
         });
        
})





app.post('/articles', (req, res) => {
    const id = (req.body.id)
    const title = req.body.title
    const description = req.body.description
    const price = req.body.price


    con.query(`UPDATE articles SET ? WHERE id = ${id}`,
        { title: title, description: description, price: price },
        function (err, result) {
            if (err) throw err;
            console.log(result);
            console.log("Record Updated!");
        });

    const article = {
        id: article.id
    }

    inventory.articles.push(article)


    // let found = {};

    // inventory.articles.forEach((a) => {
    //     if (a.id === id) {
    //         a.title = title
    //         found = a
    //     }
    // })

    // fs.writeFileSync("./inventory.json", JSON.stringify(inventory));
    // res.json(found)
})
app.delete('/article/:id', (req, res) => {
    const id = Number(req.params.id)

    con.query(`DELETE FROM articles WHERE id = ${id}`, function (err, result) {
        if (err) throw err;
        console.log(result);
        console.log("Record Deleted!");
    });

    // const index = inventory.articles.findIndex((e) => e.id == id);
    // inventory.articles.splice(index, 1);
    // fs.writeFileSync("./inventory.json", JSON.stringify(inventory));
})


// app.use((req, res, err, next) => {
//     // if (error.code === "LIMIT_FILE_SIZE") {
//     //     res.status(422).json({ error: 'Allowed file size is beaucoup' })
//     // }
//     // if (error.code === "INCORRECT_FILETYPE") {
//     //     res.status(422).json({ error: 'Only CSV are allowed' })
//     // }
// })

app.listen(port, () => console.log(`Example app listening on port ${port}!`))





// curl -i -H "Content-Type: application/json" -X PUT -d '{"dateOfBirth":"2000-01-01"}' http://localhost:8000/hello/username
// curl -X GET http://127.0.0.1:8000/hello/username

var http = require('http');
//const dotenv = require('dotenv');
//dotenv.config();
const http_host = process.env.HTTP_HOST;
const http_port = process.env.HTTP_PORT;
const mongo = require('mongodb').MongoClient;
const mongo_url = process.env.MONGO_URL;
const mongo_dbName = process.env.MONGO_DBNAME;
const mongo_collection = process.env.MONGO_COLLECTION;

function isUsernameOk(str) {
    //console.log(`isUsernameOk: str=${str}`);
    return (str ? str.match(/^[a-z]+$/) !== null : false);
}

function isBirthDateOk(str) {
    //console.log(`isBirthDateOk: str=${str}`);
    if (!str) return false;
    if (str.match(/^([1-2]\d\d\d)-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\d|3[0-1])$/) === null) return false;
    var reqDateInMs = new Date(str);
    var yesterday = (new Date() - (24 * 3600 * 1000));
    if (reqDateInMs <= yesterday) {
        //console.log("reqDateInMs <= yesterday");
        return true;
    } else {
        //console.log("reqDateInMs > yesterday");
        return false;
    }
}

function storeData(user,bday,res) {  
    mongo.connect(mongo_url, (err, client) => {
        if (err) {
            console.log(`DB connection error: ${err}`);
            res.writeHead(500, { 'Content-Type': 'text/plain' }); 
            res.write('500 DB connection error!\n');
            res.end();
            return;
        } else console.log(`Connected to server ${mongo_url}`);
        
        const collection = client.db(mongo_dbName).collection(mongo_collection);
        collection.insertOne({username: `${user}`, birthday: `${bday}` }, (err, result) => {
            if (err) {
                console.log(`Insert error: (${err}), result: ${result}\n`);
                res.writeHead(409, { 'Content-Type': 'text/plain' }); 
                res.write('409 Error inserting data! Duplicate?\n');
                res.end();
                return;
            } else {
                if (result.insertedCount){
                    console.log(`Insert result = (${result})`);
                    res.writeHead(204, { 'Content-Type': 'text/plain' }); 
                    res.end('204 No Content\n');                    
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' }); 
                    res.write('500 Error inserting data!\n');
                    res.end();
                }                
            }   
        }); // insertOne
        client.close();
    }); //mongo.connect
}// storeData

function retrieveData(username,res) {
    mongo.connect(mongo_url, (err, client) => {
        if (err) {
            console.log(`DB connection error: ${err}`);
            res.writeHead(500, { 'Content-Type': 'text/plain' }); 
            res.write('500 DB connection error!\n');
            res.end();
            return;
        } else console.log(`Connected to server ${mongo_url}`);
        
        const collection = client.db(mongo_dbName).collection(mongo_collection);
        collection.findOne({username: `${username}`}, (err, value) => {
            if (err) {
                console.log(`Retrieve error: (${err})\n`);
                res.writeHead(500, { 'Content-Type': 'text/plain' }); 
                res.write('500 Error retrieving data!\n');
                res.end();
                return;
            } else {
                if (value){
                    console.log(`Retrieved result = (${value.birthday})`);
                    
                    var userDate = new Date(value.birthday);
                    var userYear = userDate.getFullYear();
                    var userMonth = userDate.getMonth()+1;
                    var userDay = userDate.getDate();

                    var nowDate = new Date();
                    var nowYear = nowDate.getFullYear();
                    var nowMonth = nowDate.getMonth()+1;                  
                    var nowDay = nowDate.getDate();

                    var diffDays = 0; 
                    var greeting = '';

                    //console.log(`userMonth=${userMonth}, userDay=${userDay}, nowMonth=${nowMonth}, nowDay=${nowDay}\n`);
                    if ((userMonth === nowMonth) && (userDay === nowDay)) {
                        greeting = "Happy birthday!";
                    } else {
                        if (userMonth > nowMonth) {
                         // in future, we're good   
                        } else if (userMonth < nowMonth) {
                        // passed, next year only
                            nowYear+=1;
                        } else if (userMonth === nowMonth && userDay < nowDay) {
                        // passed, next year only
                            nowYear+=1;
                        }
                    
                       var futureDate = new Date(`${nowYear}-${userMonth}-${userDay}`);
                       diffDays = Math.floor((futureDate - nowDate) / (24 * 3600 * 1000));
                       greeting = `Your birthday is in ${diffDays} day(s)`;
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' }); 
                    res.write(`{ "message": "Hello, ${username}! ` + greeting + `" }\n`); 
                    res.end();                   
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' }); 
                    res.write('404 Not found!\n');
                    res.end();
                }                
            }   
        }); // findOne
        client.close();
    }); //mongo.connect
}// retrieveData

var server = http.createServer(function (req, res) {
    var r = req.url.split('/');
    var route=r[1];
    var username=r[2];
    var body;
    var birthdate="";
    
    function processGET(err, body) {
        if (isUsernameOk(username)) {
            retrieveData(username,res);
        } else {
            res.writeHead(400, { 'Content-Type': 'text/plain' }); 
            res.write('400 Bad Request\n');
            res.end();
        }
    }  

    function processPUT() {
        if ( isUsernameOk(username) && isBirthDateOk(birthdate) ) {
            console.log(`Storing { username: ${username}, birthdate: ${birthdate}  }`);
            storeData(username,birthdate,res);
        } else {
            res.writeHead(400, { 'Content-Type': 'text/plain' }); 
            res.write('400 Bad Request\n');
            res.end();
        }
    }  

    if (route === 'hello') {
        if (req.method === 'PUT') {
            req.on('data', body => { 
                birthdate=JSON.parse(body).dateOfBirth;
            });
            req.on('end', processPUT);       
        }
        else if (req.method === 'GET') {    
            processGET();
        } else {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method not allowed\n');    
        }
    } // end of route 'hello'
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('No Such Route\n');
    }
});

server.listen(http_port, http_host);
console.log(`Listening at http://${http_host}:${http_port} ...`);
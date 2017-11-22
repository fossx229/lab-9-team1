Promise=require('bluebird')
var express=require('express'),
mysql=require('mysql'),
credentials=require('./resources/credentials.json'),
DBF=require('./resources/dbf-setup.js');
var user = "fossx229"
var buttonInfo = [];

app = express(),
port = process.env.PORT || 1337;

credentials.host='ids.morris.umn.edu'; //setup database credentials

var connection = mysql.createConnection(credentials); // setup the connection

connection.connect(function(err){if(err){console.log(error)}}); // Connect to the database

app.use(express.static(__dirname + '/public')); // Tells express to use the files in the public folder

// Server endpoint for handling buttons. Upon request, will query the till_buttons table in the database and send the table information to the controller. Otherwise an error will be sent.
app.get("/buttons",function(req,res){
  var sql = 'SELECT till_buttons.*, prices.price FROM ' + user + '.till_buttons INNER JOIN '+ user + '.prices ON till_buttons.id = prices.id';
  connection.query(sql,(function(res){return function(err,rows,fields){
    if(err){console.log("We have an error:");
    console.log(err);}
    buttonInfo = rows;
    res.send(rows);
  }})(res));
});

// Server endpoint for getting items for the controller. When a request is made, it will query the database for the current transaction items, and will send this to the controller. Otherwise an Error.
app.get("/items", function(req, res){
  var sql ='SELECT * FROM ' + user +'.transaction';
  connection.query(sql,(function(res){return function(err,rows,fields){
    if(err){console.log("We have an error:");
    console.log(err);}
    //     transactionItems = rows;
    //     console.log(transactionItems);
    res.send(rows);
  }})(res));
});

// Server endpoint for handling the event where an item is clicked on the screen. Will query the database to delete the item from the transaction table which corresponds to what was clicked.
// An empty response will be sent to the controller, otherwise an error.
app.get("/itemclick", function(req, res){
  var id = req.param("id");
  var sql = 'DELETE FROM ' + user + '.transaction WHERE itemID = ' + id+';';
  connection.query(sql,(function(res){return function(err,rows,fields){
    //throws errors when clicked but deletes the right buttons when refreshed.
    if(err){console.log("We have an insertion error:");
    console.log(err);
    res.send(err);
  }
  res.send();
}})(res));
});

// Server endpoint for handling button clicks. On a button click, another item that corresponds to the clicked button will be inserted into the database. If there is already an item of that
// type in the transaction table, the quantity of that item will be incremented. Will send an empty response to the controller, otherwise an error.
app.get("/click",function(req,res){
  var id = req.param("id");

  // Extracts the item information that is stored along with the buttons in the server button array so that the insert statement is complete
  var label = extractProperty(buttonInfo, "label", id);
  var price = extractProperty(buttonInfo, "price", id);

  var sql = "INSERT INTO " + user + ".transaction VALUES (" + 01 + ", " + "NOW(), " + id + ", '" + label + "', " + 1 + ", " + price + ") ON DUPLICATE KEY UPDATE quantity = quantity + 1";

  connection.query(sql,(function(res){return function(err,rows,fields){
    if(err){console.log("We have an insertion error:");
    console.log(err);
    res.send(err);
  }

}})(res));
res.send();
});

app.get("/void", function(req, res){

  var sql = "TRUNCATE TABLE " + user + ".transaction"

  connection.query(sql,(function(res){return function(err,rows,fields){
    if(err){console.log("We have an truncation error: " + err);
    res.send(err);
  }
  res.send();
}})(res));
});

// Helper function for getting information from our button array for formatting our insert statements. We wrote it because we couldn't seem to get the map function to work...
function extractProperty (array, propertyName, id) {
  for (var i = 0; i < array.length; i++) {
    if (array[i].id == id) {
      return array[i][propertyName];
    }
  }
  return -1;
}

app.listen(port);

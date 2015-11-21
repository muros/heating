var sqlite = require('sqlite3').verbose();
var db = new sqlite.Database('temperature.db');
var util = require('util');
var express = require('express');

db.serialize(function() {
  db.run("CREATE TABLE if not exists temperature(time TEXT, temp REAL, hmdt REAL)");
});

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (text) {
  console.log('received data:', util.inspect(text));
  if (text === 'quit\n') {
    done();
  } else if (text === 'disp\n') {
    db.each("SELECT time, temp, hmdt FROM temperature", function(err, row) {
      console.log(row.time + ": " + row.temp);
    });
  } else if (text === 'clr\n') {
    db.run("DELETE FROM temperature");
  } else {
    info = text.replace(/(\r\n|\n|\r)/gm,"");
  
    var date = new Date();
    var time = date.toISOString();
    var temp = Math.random();
    var hmdt = Math.random();  
  
    db.run("INSERT into temperature(time, temp, hmdt) VALUES ('" + time + "', " 
      + temp + ", " +  hmdt + ")");
  }
});

function done() {
  console.log('Now that process.stdin is paused, there is nothing more to do.');

  db.close();
  process.exit();
}

var app = express();

app.get('/', function (req, res) {
  res.send('Thermostat greets you.');
});

app.get('/temp', function (req, res) {
  res.contentType('text/json; charset=UTF-8');
  res.send('')
})

app.use(express.static('public'));
app.use(express.static('node_modules/angular'));
app.use(express.static('js'));

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

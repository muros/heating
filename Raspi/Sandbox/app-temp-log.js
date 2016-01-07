var sqlite = require('sqlite3').verbose();
var db = new sqlite.Database('temperature.db');
var util = require('util');
var express = require('express');
var serialPort = require("serialport");
var SerialPort = serialPort.SerialPort;

var lowTemp = 17.0;
var highTemp = 22.0;
var currTemp = 17.0;
var thermState = -1;

var arduinoPortName;
var arduinoPort;
serialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    if (port.manufacturer != undefined) {
      arduinoPortName = port.comName;
    }
  });
});

db.serialize(function() {
  db.run("CREATE TABLE if not exists temperature(time TEXT, temp REAL, hmdt REAL)");
});

process.stdin.resume();
process.stdin.setEncoding("utf8");

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
  } else if (text === 'port\n') {
    console.log(arduinoPortName);
    arduinoPort = new SerialPort(arduinoPortName,
        {
          baudrate: 9600,
          parser: serialPort.parsers.readline("\n")
        });
    arduinoPort.on("data", function (data) {
      console.log('DATA: ' +  data);
      var termostat = JSON.parse(data);
      var date = new Date();
      var time = date.toISOString();
      var temp = termostat.temp;
      var hmdt = termostat.hmdt;
      var state = termostat.state;

      db.run("INSERT into temperature(time, temp, hmdt) VALUES ('" + time + "', "
          + temp + ", " +  hmdt + ")");

      if ((thermState != -1) && (thermState != state)) {
        state = thermState;
        thermState = -1;
      }

      //var str = "1 17.0 22.5 21.5\n";
      var str = cmdToThermostat(state, lowTemp, highTemp, currTemp);
      var bytes = [];
      for (var i = 0; i < str.length; ++i) {
        bytes.push(str.charCodeAt(i));
      }
      arduinoPort.write(bytes, function(err, results) {
        console.log('ack');
      });
    });
  } else if (text === 'night\n') {
    thermState = 1;
  } else if (text === 'day\n') {
    thermState = 2;
  } else if (text === 'timer\n') {
    thermState = 3;
  } else if (text === 'burst\n') {
    thermState = 4;
  } else if (text === 'off\n') {
    thermState = 0;
  } else {
    console.log("Unknown command.")
  }
});

/**
 * Create command string that is sent to Arduino controller - thermostat.
 * @param state state can be 0 - 4
 * @param lowTemp night temperature in state 1
 * @param highTemp high temperature in state 2
 * @param currTemp any temperature in state 3
 */
function cmdToThermostat(state, lowTemp, highTemp, currTemp) {
  var cmdStr = "" + state + " " + lowTemp + " " + highTemp + " " + currTemp + "\n";

  return cmdStr;
}

function done() {
  console.log('Now that process.stdin is paused, there is nothing more to do.');

  db.close();
  process.exit();
}

var app = express();

app.get('/', function (req, res) {
  res.send('Thermostat greets thou.');
});

app.get('/temp', function (req, res) {
  console.log("temp");
  var temps = [];
  var i = 0;
  db.all("SELECT time, temp, hmdt FROM temperature WHERE time > datetime('now', 'start of day')", function(err, rows) {
    console.log(rows);
    for(j = 0; j < rows.length; j++) {
      var row = rows[j];
      var d = new Date(row.time);
      var temp = [];
      var date = [];
      date[0] = d.getHours();
      date[1] = d.getMinutes();
      date[2] = d.getSeconds();
      temp[0] = date;
      temp[1] = row.temp;
      temp[2] = row.hmdt;
      temps[i++] = temp;
      console.log(temp);
    }
    res.contentType('text/json; charset=UTF-8');
    res.send(temps);
  });
});

app.use(express.static('public'));
app.use(express.static('js'));

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

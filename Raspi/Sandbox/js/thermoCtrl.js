/**
 * Created by uros on 24.11.2015.
 */
'use strict';

/*
app.controller('thermoCtrl', function($scope, $http) {
    $http.get("http://localhost:3000/temp")
        .success(function(response) {
            $scope.tempData = response;
        });
});
*/
/* Controllers */
google.load("visualization", "1.0", {packages:["corechart"]});
google.setOnLoadCallback(function () {
  angular.bootstrap(document.body, ['thermoApp']);
});

angular.module('thermoApp.controllers', []).
  controller('chartCtrl', function($scope, $http) {

  // Create the data table.
  var data = new google.visualization.DataTable();

  data.addColumn('timeofday', 'Time');
  data.addColumn('number', 'Temperature');
  data.addColumn('number', 'Humidity');
  //data.addRows(tempData);

  $http.get("http://localhost:3000/temp")
      .success(function(response) {
        data.addRows(response);

        // Set chart options
        var options = {'title':'Living room',
          'width':500,
          'height':300,
          series: {
            0: {targetAxisIndex: 0},
            1: {targetAxisIndex: 1}
          },
          vAxes: {
            0: {title: 'Temperature', maxValue: 30},
            1: {title: 'Humidity', maxValue: 100}
          }
        };

        // Instantiate and draw our chart, passing in some options.
        var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
        chart.draw(data, options);
      });
  });
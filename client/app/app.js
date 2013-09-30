'use strict';

var app = angular.module('app', ['ui.bootstrap', , 'dealService']);

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider
		.when('/', {templateUrl: 'home/home.html', controlle: homeController})
		//.when('/users/:userId')
		.otherwise({redirectTo: '/'});
}]);

app.filter('iif', function () {
  return function(input, trueValue, falseValue) {
    var value = input ? trueValue : falseValue;
    return input ? trueValue : falseValue;
  };
});

app.filter('range', function() {
	console.log("range");
	return function(input, total) {
		for(var i=0; i < total; i++) {
			input.push(i);
		}
		console.log(total);
		return input;
	};
});
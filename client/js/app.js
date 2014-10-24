'use strict';

/* App Module */

var jscalcApp = angular.module('jscalcApp', [
  'ngRoute',
  'ngMaterial',
  'angularytics',
  'ui.ace',

  'jscalcControllers'
])

.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('!');
    $routeProvider.

      when('/edit/:calcId', {
        templateUrl: 'partials/edit',
        controller: 'EditCtrl'
      }).

      when('/', {
        templateUrl: 'partials/welcome'
      }).

      otherwise({
        redirectTo: '/'
      });
  }])

.config(['AngularyticsProvider',
  function(AngularyticsProvider) {
    AngularyticsProvider.setEventHandlers(['Console', 'GoogleUniversal']);
  }])

// .run(function(Angularytics) {
//   Angularytics.init();
// });

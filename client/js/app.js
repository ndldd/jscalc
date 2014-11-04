'use strict';

/* App Module */

var jscalcApp = angular.module('jscalcApp', [
  'angularytics',
  'http-auth-interceptor',
  'ngRoute',
  'ngMaterial',
  'ui.ace',

  'jscalcControllers',
  'jscalcDirectives',
  'jscalcServices',
  'preloadedData',
  'material.services.media'
])

.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });

    $routeProvider.
      when('/source/:calcId', {
        templateUrl: '/partials/source',
        controller: 'SourceCtrl'
      }).

      when('/calc/:calcId', {
        templateUrl: '/partials/published',
        controller: 'PublishedCtrl'
      }).

      when('/account', {
        templateUrl: '/partials/account',
        controller: 'AccountCtrl'
      }).

      when('/', {
        templateUrl: '/partials/welcome',
        controller: 'WelcomeCtrl'
      }).

      otherwise({
        redirectTo: '/'
      });
  }])

.config(['AngularyticsProvider',
  function(AngularyticsProvider) {
    AngularyticsProvider.setEventHandlers(['Console', 'GoogleUniversal']);
  }])

.run([
  'Angularytics',
  '$rootScope',
  function(Angularytics, $rootScope) {
    Angularytics.init();
  }]);

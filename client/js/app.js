'use strict';

/* App Module */

var jscalcApp = angular.module('jscalcApp', [
  'angularytics',
  'http-auth-interceptor',
  'ngRoute',
  'ngMaterial',
  'ui.ace',
  'ui.sortable',

  'jscalcControllers',
  'jscalcDirectives',
  'jscalcServices',
  'preloadedData',
  'material.services.media'
])

.constant('DEFAULTS', {
  'tabSize': 2
})

.constant('INPUT_TYPES', [
  {type: 'number', title: 'Number'},
  {type: 'binary', title: 'Checkbox'},
  {type: 'date', title: 'Date'},
  {type: 'choice', title: 'Radio'},
  {type: 'list', title: 'Repeating Item'}
])

.constant('OUTPUT_TYPES', [
  {type: 'value', title: 'Value'},
  {type: 'table', title: 'Table'},
  {type: 'chart', title: 'Chart'}
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

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
  'tabSize': 2,
  'dateInputValueType': 'relative'
})

.constant('INPUT_TYPES', [
  {type: 'number', title: 'Number', default: null},
  {type: 'binary', title: 'Checkbox', default: false},
  {type: 'date', title: 'Date', default:
      {"params":{"delta":0,"units":"days"},"type":"relative"}},
  {type: 'choice', title: 'Radio', default: null},
  {type: 'list', title: 'Repeating Item', default: []}
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

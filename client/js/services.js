'use strict';

/* Services */

var jscalcServices = angular.module('jscalcServices', ['ngResource']);

jscalcServices.factory('User', ['$resource',
  function($resource){
    return $resource('/api/account', {}, {
      saveEmail: {method:'POST', url: '/api/account/email'},
      savePassword: {method:'POST', url: '/api/account/password'}
    });
  }]);

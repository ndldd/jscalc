'use strict';

/* Services */

var jscalcServices = angular.module('jscalcServices', ['ngResource']);

jscalcServices.factory('User', ['$resource', 'toastInterceptor',
  function($resource, toastInterceptor){
    return $resource('/api/account', {}, {
      saveEmail: {method:'POST', url: '/api/account/email',
          interceptor: toastInterceptor},
      savePassword: {method:'POST', url: '/api/account/password',
          interceptor: toastInterceptor},
      delete: {method:'DELETE', interceptor: toastInterceptor}
    });
  }]).
  factory('Source', ['$resource', 'toastInterceptor',
    function($resource, toastInterceptor){
      return $resource('/api/source/:calcId', {calcId:'@id'}, {
        get: {method:'GET', interceptor: toastInterceptor},
        post: {method:'POST', interceptor: toastInterceptor},
        delete: {method:'DELETE', interceptor: toastInterceptor}
      });
    }]).
  factory('Calc', ['$resource', 'toastInterceptor',
    function($resource, toastInterceptor){
      return $resource('/api/calc/:calcId', {calcId:'@id'}, {
        get: {method:'GET', interceptor: toastInterceptor}
      });
    }]).
  factory('toastInterceptor', ['$mdToast', '$q', function($mdToast, $q) {
    return {
      responseError: function(rejection) {
        if (rejection.status == 400) {
          $mdToast.show({
            template: '<md-toast>' + rejection.data + '</md-toast>',
            hideDelay: 3000
          });
        } else {
          $mdToast.show({
            template: '<md-toast>Oops, an error.</md-toast>',
            hideDelay: 3000
          });
        }
        return $q.reject(rejection);
      }
    };
  }]);

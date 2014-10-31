'use strict';

/* Controllers */

var jscalcControllers = angular.module('jscalcControllers', []);

jscalcControllers.controller('JscalcCtrl', [
  '$scope',
  '$location',
  '$mdSidenav',
  '$timeout',
  'User',
  '$mdDialog',
  'authService',
  '$mdToast',
  '$http',
  'PRELOADED_DATA',
  '$mdMedia',
  function($scope, $location, $mdSidenav, $timeout, User,
      $mdDialog, authService, $mdToast, $http, PRELOADED_DATA, $mdMedia) {
    $scope.user = PRELOADED_DATA.isAuthenticated ? User.get() : null;

    $scope.$watch(function() {
      return $mdMedia('min-width: 1400px');
    }, function(sidenavsLockedOpen) {
      $scope.sidenavsLockedOpen = sidenavsLockedOpen;
    });

    $scope.isCurrentLocation = function(location) {
      return location === $location.path();
    };

    $scope.toggleNav = function() {
      $timeout(function() {
        $mdSidenav('left').toggle();
      });
    };

    $scope.login = function($event) {
      $mdDialog.show({
            targetEvent: $event,
            controller: 'AuthDialogCtrl',
            templateUrl: '/partials/auth_dialog'
          }).then(function() {
            authService.loginConfirmed();
            if ($scope.user === null) {
              $scope.user = User.get();
            }
          }, function() {
            authService.loginCancelled();
          });
    };

    $scope.$on('event:auth-loginRequired', function() {
      $scope.login();
    });

    $scope.logout = function() {
      $http.get('/api/logout').success(function() {
            $mdToast.show({
              template: '<md-toast>Signed out.</md-toast>',
              hideDelay: 3000
            });
            $scope.user = null;
          }).
          error(function(data) {
            $mdToast.show({
              template: '<md-toast>Oops, an error.</md-toast>',
              hideDelay: 3000
            });
          });
    };
  }]);

jscalcControllers.controller('SourceCtrl', [
  '$scope',
  '$routeParams',
  '$timeout',
  function($scope, $routeParams, $timeout) {
    $scope.calcId = $routeParams.calcId;
    $scope.selectedTabIndex = 0;
    $scope.editor = null;

    $scope.onAceLoad = function(editor) {
      $scope.editor = editor;
      editor.getSession().setMode("ace/mode/javascript");
      editor.getSession().setTabSize(2);
    };

    $scope.$watch('selectedTabIndex', function(value) {
      if (value == 1) {
        $timeout(function() {
          if ($scope.editor !== null) {
            $scope.editor.resize(true);
            $scope.editor.focus();
          }
        });
      }
    });
  }]);

jscalcControllers.controller('CalcCtrl', ['$scope',
  function($scope) {
  }]);

jscalcControllers.controller('AuthDialogCtrl', [
  '$scope',
  '$mdDialog',
  '$http',
  '$q',
  function($scope, $mdDialog, $http, $q) {
    $scope.canceler = null;

    $scope.cancel = function() {
      if ($scope.canceler !== null) {
        $scope.canceler.resolve();
      }
      $mdDialog.cancel();
    };

    $scope.signUp = function() {
      $scope.canceler = $q.defer();
      $http.post('/api/signup', $scope.params,
          {timeout: $scope.canceler.promise}).success(function() {
            $mdDialog.hide();
          }).
          error(function(data) {
            $scope.canceler = null;
            $scope.errorMessage = data || 'Oops, an error.';
          });
    };

    $scope.signIn = function() {
      $scope.canceler = $q.defer();
      $http.post('/api/login', $scope.params,
          {timeout: $scope.canceler.promise}).success(function() {
            $mdDialog.hide();
          }).
          error(function(data) {
            $scope.canceler = null;
            $scope.errorMessage = data || 'Oops, an error.';
          });
    };
  }]);

'use strict';

/* Controllers */

var jscalcControllers = angular.module('jscalcControllers', []);

jscalcControllers.controller('JscalcCtrl', [
  '$scope',
  '$location',
  '$materialSidenav',
  '$timeout',
  'User',
  '$materialDialog',
  'authService',
  '$materialToast',
  '$http',
  'PRELOADED_DATA',
  function($scope, $location, $materialSidenav, $timeout, User,
      $materialDialog, authService, $materialToast, $http, PRELOADED_DATA) {
    $scope.user = PRELOADED_DATA.isAuthenticated ? User.get() : null;

    $scope.isCurrentLocation = function(location) {
      return location === $location.path();
    };

    $scope.toggleNav = function() {
      $timeout(function() {
        $materialSidenav('left').toggle();
      });
    };

    $scope.login = function($event) {
      $materialDialog.show({
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
            $materialToast.show({
              template: '<material-toast>Signed out.</material-toast>',
              hideDelay: 3000
            });
            $scope.user = null;
          }).
          error(function(data) {
            $materialToast.show({
              template: '<material-toast>Oops, an error.</material-toast>',
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
  '$materialDialog',
  '$http',
  '$q',
  function($scope, $materialDialog, $http, $q) {
    $scope.selectedTabIndex = 0;
    $scope.canceler = null;

    $scope.cancel = function() {
      if ($scope.canceler !== null) {
        $scope.canceler.resolve();
      }
      $materialDialog.cancel();
    };

    $scope.signUp = function() {
      $scope.canceler = $q.defer();
      $http.post('/api/signup', $scope.signUpParams,
          {timeout: $scope.canceler.promise}).success(function() {
            $materialDialog.hide();
          }).
          error(function(data) {
            $scope.canceler = null;
            $scope.signUpErrorMessage = data || 'Oops, an error.';
          });
    };

    $scope.signIn = function() {
      $scope.canceler = $q.defer();
      $http.post('/api/login', $scope.signInParams,
          {timeout: $scope.canceler.promise}).success(function() {
            $materialDialog.hide();
          }).
          error(function(data) {
            $scope.canceler = null;
            $scope.signInErrorMessage = data || 'Oops, an error.';
          });
    };
  }]);

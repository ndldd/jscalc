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

    $scope.setUser = function(user) {
      $scope.user = user;
    };

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

    $scope.closeNav = function() {
      $timeout(function() {
        $mdSidenav('left').close();
      });
    }

    $scope.login = function($event) {
      $mdDialog.show({
            targetEvent: $event,
            controller: 'AuthDialogCtrl',
            templateUrl: '/partials/auth_dialog',
            onComplete: function(scope, element) {
              element[0].querySelector('#email').focus();
            }
          }).then(function() {
            authService.loginConfirmed();
            if ($scope.user === null) {
              $scope.user = User.get();
            }
          }, function() {
            // 2nd argument is necessary because otherwise requests will not
            // get rejected.
            authService.loginCancelled(null, {});
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
    $scope.signInMode = false;
    $scope.canceler = null;
    $scope.params = {};

    $scope.toggleMode = function() {
      $scope.signInMode = !$scope.signInMode;
      $scope.errorMessage = '';
    };


    $scope.submit = function() {
      if ($scope.signInMode) {
        $scope.signIn();
      } else {
        $scope.signUp();
      }
    };

    $scope.handleKeydown = function($event) {
      if ($event.keyCode == 13) {
        $event.preventDefault();
        $scope.submit();
      }
    };

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

    $scope.forgot = function() {
      window.open('/forgot', '_blank');
    }
  }]);

jscalcControllers.controller('AccountCtrl', [
  '$scope',
  'User',
  '$mdToast',
  '$location',
  function($scope, User, $mdToast, $location) {
    $scope.processingEmail = false;
    $scope.processingPassword = false;
    $scope.processingDeleteAccount = false;
    $scope.emailParams = {};
    $scope.passwordParams = {};

    $scope.changeEmail = function() {
      $scope.processingEmail = true;
      User.saveEmail($scope.emailParams).$promise.then(function() {
        $mdToast.show({
          template: '<md-toast>Email has been changed.</md-toast>',
          hideDelay: 3000
        });
        if ($scope.user.email) {
          $scope.user.email = $scope.emailParams.email;
        }
        $scope.emailParams.email = '';
      }).finally(function() {
        $scope.processingEmail = false;
      });
    };

    $scope.changePassword = function() {
      $scope.processingPassword = true;
      User.savePassword($scope.passwordParams).$promise.then(function() {
        $mdToast.show({
          template: '<md-toast>Password has been changed.</md-toast>',
          hideDelay: 3000
        });
        $scope.passwordParams.oldPassword = '';
        $scope.passwordParams.newPassword = '';
        $scope.passwordParams.confirmPassword = '';
      }).finally(function() {
        $scope.processingPassword = false;
      });
    };


    $scope.deleteAccount = function() {
      if (window.confirm("Careful: are you sure you want to permanently delete your account?")) {
        $scope.processingDeleteAccount = true;
        User.delete().$promise.then(function() {
          $mdToast.show({
            template: '<md-toast>Your account has been deleted.</md-toast>',
            hideDelay: 3000
          });
          $scope.setUser(null);
          $location.path('/');
        }).finally(function() {
          $scope.processingDeleteAccount = false;
        });
      }
    };
  }]);

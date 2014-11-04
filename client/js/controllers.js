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
  '$document',
  '$templateCache',
  '$q',
  function($scope, $location, $mdSidenav, $timeout, User,
      $mdDialog, authService, $mdToast, $http, PRELOADED_DATA, $mdMedia,
      $document, $templateCache, $q) {


    $scope.user = PRELOADED_DATA.isAuthenticated ? User.get() : null;
    $scope.menuShown = false;
    $scope.view = {};
    $scope.calcs = {};

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

    $scope.getRandomString = function(length) {
      var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var result = '';
      for (var i = length; i > 0; --i) {
        result += chars[Math.round(Math.random() * (chars.length - 1))];
      }
      return result;
    };

    $scope.new = function() {
      var id = $scope.getRandomString(16);
      $scope.calcs[id] = {doc: {}, saved: false};
      $location.path('/source/' + id);
    };

    $scope.getCalcNameOrPlaceholder = function(name) {
      return _.str.isBlank(name) ? 'Untitled calculator' : _.str.trim(name);
    };

    $scope.getCalcCaption = function(calc) {
      return (calc.saved ? '' : '[Unsaved] ') +
          $scope.getCalcNameOrPlaceholder(calc.doc ? calc.doc.name: null);
    };

    var getCalcList = function() {
      var calcList = [];
      _.forOwn($scope.calcs, function(calc, calcId) {
        calcList.push({
          caption: $scope.getCalcCaption(calc),
          url: '/source/' + calcId
        });
      });
      if ($scope.user && $scope.user.$resolved) {
        _.forEach($scope.user.calcs, function(calc) {
          if (!(calc._id in $scope.calcs)) {
            calcList.push({
              caption: $scope.getCalcNameOrPlaceholder(calc.doc ? calc.doc.name: null),
              url: '/source/' + calc._id
            });
          }
        });
      }
      return calcList;
    };

    $scope.$watch(getCalcList, function(newValue) {
      $scope.calcList = newValue;
    }, true);

    $scope.login = function($event) {
      return $mdDialog.show({
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
          }, function(reason) {
            // 2nd argument is necessary because otherwise requests will not
            // get rejected.
            authService.loginCancelled(null, reason);
            return $q.reject(reason);
          });
    };

    $scope.$on('event:auth-loginRequired', function() {
      $scope.login();
    });

    var areAllChangesSaved = function() {
      return _.every(_.pluck(_.values($scope.calcs), 'saved'));
    };

    $scope.logout = function() {
      if(!areAllChangesSaved()) {
        if(!window.confirm('Discard unsaved changes?')) {
          return;
        }
      }
      $http.get('/api/logout').success(function() {
            $mdToast.show({
              template: '<md-toast>Signed out.</md-toast>',
              hideDelay: 3000
            });
            $scope.user = null;
            $scope.calcs = [];
            $location.path('/');
          });
    };

    $scope.toggleMenu = function(event) {
      $scope.menuShown = !$scope.menuShown;
      event.stopPropagation();
    };

    $document.on('click', function() {
      $scope.$apply(function() {
        $scope.menuShown = false;
      });
    });

    window.onbeforeunload = function() {
      if(!areAllChangesSaved()) {
        return 'Unsaved changes will be discarded.'
      }
    };

    $scope.broadcast = function(name) {
      $scope.$broadcast(name);
    };
  }]);

jscalcControllers.controller('SourceCtrl', [
  '$scope',
  '$routeParams',
  '$timeout',
  'Source',
  '$mdToast',
  '$location',
  function($scope, $routeParams, $timeout, Source, $mdToast, $location) {
    $scope.calcId = $routeParams.calcId;
    $scope.calc = null;
    $scope.view.isEditMode = false;
    $scope.view.isCalcMode = false;
    $scope.saving = false;
    if (!($scope.calcId in $scope.calcs)) {
      Source.get({calcId: $scope.calcId}, function(source) {
        if (!($scope.calcId in $scope.calcs)) {
          var calc = {doc: source.doc, saved: true};
          $scope.calc = calc;
          $scope.calcs[$scope.calcId] = calc;
        } else {
          $scope.calc = $scope.calcs[$scope.calcId];
        }
        $scope.view.isEditMode = true;
        $scope.view.isCalcMode = true;
      });
    } else {
      $scope.calc = $scope.calcs[$scope.calcId];
      $scope.view.isEditMode = true;
      $scope.view.isCalcMode = true;
    }
    $scope.selectedTabIndex = 0;
    $scope.editor = null;
    $scope.$watch(function() {
      if ($scope.calc !== null) {
        return $scope.getCalcCaption($scope.calc);
      }
      return '';
    }, function(newCaption) {
      $scope.title = newCaption;
      $scope.view.title = newCaption;
    });
    $scope.$watch(function() {
      return !_.find($scope.user.calcs, {_id: $scope.calcId});
    }, function(newValue) {
      $scope.newAndNotSaved = newValue;
    });
    $scope.view.description = '';

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

    $scope.save = function($event) {
      $scope.saving = true;
      var post = function() {
        return Source.post({calcId: $scope.calcId}, {doc: $scope.calc.doc}).
            $promise.then(function() {
              $scope.calc.saved = true;
              if (!_.find($scope.user.calcs, {_id: $scope.calcId})) {
                $scope.user.calcs.push({_id: $scope.calcId, doc: $scope.calc.doc});
              }
              $mdToast.show({
                template: '<md-toast>Calculator has been saved!</md-toast>',
                hideDelay: 3000
              });
            });
      };
      if ($scope.user === null) {
        // For better dialog animation we pass the $event.
        $scope.login($event).then(post).finally(function() {
          $scope.saving = false;
        });
      } else {
        post().finally(function() {
          $scope.saving = false;
        });
      }
    };

    $scope.$on('jscalc-delete', function() {
      if (!window.confirm('Are you sure you want to delete this calculator?')) return;
      var finish = function() {
        $mdToast.show({
          template: '<md-toast>Calculator has been deleted!</md-toast>',
          hideDelay: 3000
        });
        $location.path('/');
      };
      if (!_.find($scope.user.calcs, {_id: $scope.calcId})) {
        delete $scope.calcs[$scope.calcId];
        finish();
      } else {
        Source.delete({calcId: $scope.calcId}).
            $promise.then(function() {
              _.remove($scope.user.calcs, {_id: $scope.calcId});
              delete $scope.calcs[$scope.calcId];
              finish();
            });
      }
    });

    $scope.$on('jscalc-copy', function() {
      var id = $scope.getRandomString(16);
      $scope.calcs[id] = {doc: angular.copy($scope.calc.doc), saved: false};
      $location.path('/source/' + id);
    });
  }]);

jscalcControllers.controller('PublishedCtrl', [
  '$scope',
  '$routeParams',
  'Calc',
  '$location',
  function($scope, $routeParams, Calc, $location) {
    $scope.calcId = $routeParams.calcId;
    $scope.calc = null;
    $scope.view.isEditMode = false;
    $scope.view.isCalcMode = false;
    $scope.title = '';
    $scope.view.title = '';
    $scope.view.description = '';
    Calc.get({calcId: $scope.calcId}, function(calc) {
      $scope.calc = {doc: calc.doc};
      var caption = $scope.getCalcNameOrPlaceholder(calc.doc ? calc.doc.name: null);
      $scope.title = caption;
      $scope.view.title = caption;
      $scope.view.isCalcMode = true;
    });

    $scope.$on('jscalc-copy', function() {
      var id = $scope.getRandomString(16);
      $scope.calcs[id] = {doc: angular.copy($scope.calc.doc), saved: false};
      $location.path('/source/' + id);
    });
  }]);

jscalcControllers.controller('ToolbarToolsCtrl', ['$scope',
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
    $scope.title = 'Account Settings';
    $scope.view.isEditMode = false;
    $scope.view.isCalcMode = false;
    $scope.view.title = 'Account Settings';
    $scope.view.description = '';

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


jscalcControllers.controller('WelcomeCtrl', [
  '$scope',
  function($scope) {
    $scope.title = 'JSCalc';
    $scope.view.isEditMode = false;
    $scope.view.isCalcMode = false;
    $scope.view.title = 'JSCalc: Build a Custom Online Calculator';
    $scope.view.description = 'A web app that lets users create custom online calculators with minimal knowledge of programming';
  }]);

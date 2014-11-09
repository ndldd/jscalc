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
            $scope.calcs = {};
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
  '$q',
  'DEFAULTS',
  '$interval',
  '$mdBottomSheet',
  function($scope, $routeParams, $timeout, Source, $mdToast, $location, $q,
      DEFAULTS, $interval, $mdBottomSheet) {

    /**
     * UI and calculator resource.
     */

    $scope.DEFAULTS = DEFAULTS;
    $scope.view.isEditMode = false;
    $scope.view.isCalcMode = false;
    $scope.calcId = $routeParams.calcId;
    $scope.calc = null;
    $scope.inputs = {};
    var calcPromise = $q(function(resolve) {
      if (!($scope.calcId in $scope.calcs)) {
        Source.get({calcId: $scope.calcId}, function(source) {
          if (!($scope.calcId in $scope.calcs)) {
            $scope.calc = {doc: source.doc, saved: true};
            $scope.calcs[$scope.calcId] = $scope.calc;
            resolve();
          } else {
            $scope.calc = $scope.calcs[$scope.calcId];
            resolve();
          }
        });
      } else {
        $scope.calc = $scope.calcs[$scope.calcId];
        resolve();
      }
    });
    calcPromise.then(function() {
      $scope.view.isEditMode = true;
      $scope.view.isCalcMode = true;
      $scope.savedCalcDoc = $scope.calc.saved ?
          angular.copy($scope.calc.doc) : null;
      $scope.$watch(function() {
        if ($scope.savedCalcDoc !== null) {
          if (!angular.equals($scope.savedCalcDoc, $scope.calc.doc)) {
            $scope.calc.saved = false;
            $scope.savedCalcDoc = null;
          }
        }
      });
    });
    $scope.saving = false;
    $scope.settingsTemplate = '/partials/settings_blank';
    $scope.selectedTabIndex = 0;
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
      return !$scope.user || !$scope.user.$resolved ||
          !_.find($scope.user.calcs, {_id: $scope.calcId});
    }, function(newValue) {
      $scope.newAndNotSaved = newValue;
    });
    $scope.view.description = '';

    var editorPromise = $q(function(resolve) {
      $scope.onAceLoad = function(editor) {
        $scope.editor = editor;
        resolve();
      };
    });
    editorPromise.then(function() {
      $scope.editor.getSession().setMode("ace/mode/javascript");
    });
    $q.all([calcPromise, editorPromise]).then(function() {
      $scope.editor.getSession().setValue($scope.calc.doc.script || '');

      var readValue = function() {
        $scope.calc.doc.script = $scope.editor.getSession().getValue();
      };
      $scope.editor.getSession().on('changeCursor', readValue);
      var stopInterval = $interval(readValue, 1000);
      $scope.$on('$destroy', function() {
        $interval.cancel(stopInterval);
      });

      $scope.$watch('calc.doc.tabSize', function(newValue) {
        $scope.editor.getSession().setTabSize(newValue || DEFAULTS.tabSize);
      });
    });
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
              $scope.savedCalcDoc = angular.copy($scope.calc.doc);
              if ($scope.user !== null) {
                var maybeAddCalc = function() {
                  if (!_.find($scope.user.calcs, {_id: $scope.calcId})) {
                    $scope.user.calcs.push({_id: $scope.calcId, doc: $scope.calc.doc});
                  }
                };
                if ($scope.user.$resolved) {
                  maybeAddCalc();
                } else {
                  $scope.user.$promise.then(maybeAddCalc);
                }
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

    /**
     * Calculator configuration.
     */

    $scope.openSettings = function(settingsTemplate, settingsModel) {
      $scope.settingsTemplate = settingsTemplate;
      $scope.settingsModel = settingsModel;
      if (!$scope.sidenavsLockedOpen) {
        $timeout(function() {
          $scope.settingsOpen = true;
        });
      }
    };

    /**
     * From the supplied inputs object, removes those inputs that no longer have
     * corresponding metainputs, and for inputs that are objects/arrays, creates
     * empty values where they are absent. Called on calculator inputs and on
     * default inputs whenever metainputs are added/removed.
     */
    var fixInputs = function(inputs, metaInputs) {
      var idsHash = {};
      _.forEach(metaInputs, function(metaInput) {
        idsHash[metaInput.id] = true;
        if (metaInput.type == 'date' && !(metaInput.id in inputs)) {
          inputs[metaInput.id] = {};
        }
        if (metaInput.type == 'list' && !(metaInput.id in inputs)) {
          inputs[metaInput.id] = [];
        }
        if (metaInput.type == 'list') {
          _.forEach(inputs[metaInput.id], function(inputs) {
            fixInputs(inputs, metaInput.metaInputs);
          });
        }
      });
      for (var id in inputs) {
        if (!(id in idsHash)) {
          delete inputs[id];
        }
      }
    };

    var forEachMetaInput = function(metaInputs, f) {
      _.forEach(metaInputs || [], function(metaInput) {
        f(metaInput);
        if (metaInput.type == 'list') {
          forEachInput(metaInput.metaInputs);
        }
      });
    };

    var forEachMetaOutput = function(metaOutputs, f) {
      _.forEach(metaOutputs || [], function(metaOutput) {
        f(metaOutput);
      });
    };

    var getNewInputId = function() {
      var id = 0;
      forEachMetaInput($scope.calc.doc.metaInputs, function(metaInput) {
        if (metaInput.id > id) {
          id = metaInput.id;
        }
      });
      return id + 1;
    };

    var getNewOutputId = function() {
      var id = 0;
      forEachMetaOutput($scope.calc.doc.metaOutputs, function(metaOutputs) {
        if (metaOutputs.id > id) {
          id = metaOutputs.id;
        }
      });
      return id + 1;
    };

    var getNewName = function() {
      var namesHash = {};
      var addName = function(item) {
        namesHash[item.name] = true;
      };
      forEachMetaInput($scope.calc.doc.metaInputs, addName);
      forEachMetaOutput($scope.calc.doc.metaOutputs, addName);
      var letters = 'abcdefghijklmnopqrstuvwxyz';
      var getNameOfLength = function(prefix, length) {
        if (!length) {
          return (prefix in namesHash) ? undefined : prefix;
        }
        for (var i = 0; i < letters.length; i++) {
          var letter = letters[i];
          var name = getNameOfLength(prefix + letter, length - 1);
          if (name) return name;
        }
      };
      var length = 1;
      var name;
      while(true) {
        name = getNameOfLength('', length);
        if (name) return name;
        length += 1;
      }
    };

    $scope.addInput = function($event) {
      $mdBottomSheet.show({
        templateUrl: '/partials/bottom_sheet_inputs',
        controller: 'InputsBottomSheetCtrl',
        targetEvent: $event
      }).then(function(inputType) {
        if (!('metaInputs' in $scope.calc.doc)) {
          $scope.calc.doc.metaInputs = [];
        }
        var metaInput = {
          id: getNewInputId(),
          name: getNewName(),
          type: inputType
        };
        if (inputType == 'binary') {
          metaInput.presentationType = 'checkbox';
        }
        $scope.calc.doc.metaInputs.push(metaInput);
        if (!$scope.calc.doc.defaults) {
          $scope.calc.doc.defaults = {};
        }
        fixInputs($scope.calc.doc.defaults, $scope.calc.doc.metaInputs);
        fixInputs($scope.inputs, $scope.calc.doc.metaInputs);
      });
    };

    $scope.addOutput = function($event) {
      $mdBottomSheet.show({
        templateUrl: '/partials/bottom_sheet_outputs',
        controller: 'OutputsBottomSheetCtrl',
        targetEvent: $event
      }).then(function(outputType) {
        if (!('metaOutputs' in $scope.calc.doc)) {
          $scope.calc.doc.metaOutputs = [];
        }
        $scope.calc.doc.metaOutputs.push({
          id: getNewOutputId(),
          name: getNewName(),
          type: outputType
        })
      });
    };

    $scope.configureInput = function(metaInputs, metaInput) {
      $scope.openSettings('/partials/settings_' + metaInput.type, {
        metaInputs: metaInputs,
        metaInput: metaInput
      });
    };

    $scope.deleteInput = function(metaInputs, id) {
      _.remove(metaInputs, {id: id});
      fixInputs($scope.calc.doc.defaults, $scope.calc.doc.metaInputs);
      fixInputs($scope.inputs, $scope.calc.doc.metaInputs);
    };

    $scope.isNameConflict = function(metaInputs, metaInput) {
      var otherMetaInputs = _.reject(metaInputs, {'id': metaInput.id});
      return _.some(otherMetaInputs, {'name': metaInput.name});
    };
  }]);

jscalcControllers.controller('InputsBottomSheetCtrl', [
  '$scope',
  '$mdBottomSheet',
  'INPUT_TYPES',
  function($scope, $mdBottomSheet, INPUT_TYPES) {
    $scope.INPUT_TYPES = INPUT_TYPES;
    $scope.hideBottomSheet = function(result) {
      $mdBottomSheet.hide(result);
    };
  }]);

jscalcControllers.controller('OutputsBottomSheetCtrl', [
  '$scope',
  '$mdBottomSheet',
  'OUTPUT_TYPES',
  function($scope, $mdBottomSheet, OUTPUT_TYPES) {
    $scope.OUTPUT_TYPES = OUTPUT_TYPES;
    $scope.hideBottomSheet = function(result) {
      $mdBottomSheet.hide(result);
    };
  }]);

jscalcControllers.controller('PublishedCtrl', [
  '$scope',
  '$routeParams',
  'Calc',
  '$location',
  function($scope, $routeParams, Calc, $location) {
    $scope.calcId = $routeParams.calcId;
    $scope.calc = null;
    $scope.inputs = {};
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
  'Angularytics',
  function($scope, $mdDialog, $http, $q, Angularytics) {
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
            Angularytics.trackEvent("Account", "Sign up");
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

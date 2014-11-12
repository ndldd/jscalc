'use strict';

/* Directives */

angular.module('jscalcDirectives', [])
  .directive('jscalcCalc', [
    '$mdToast',
    'DEFAULTS',
    '$location',
    '$timeout',
    'jscalcDateInput',
    function($mdToast, DEFAULTS, $location, $timeout, jscalcDateInput) {
    return {
      restrict: 'E',
      templateUrl: '/partials/calc',
      scope: {
        doc: '=',
        inputs: '=',
        editMode: '=',
        addInput: '&?',
        addOutput: '&?',
        configureInput: '&?',
        deleteInput: '&?',
        gotoLine: '&?'
      },
      link: function($scope, element, attr) {
        $scope.DEFAULTS = DEFAULTS;
        var blobUrl;
        var worker = null;
        $scope.workerBuzy = false;
        $scope.workerError = null;
        $scope.debugMode = false;
        var recalculationScheduled = false;
        var calculationTimeoutPromise = null;

        angular.copy($scope.doc.defaults || {}, $scope.inputs);

        if (!('metaInputs' in $scope.doc)) {
          $scope.doc.metaInputs = [];
        }

        var convertInputs = function(inputs, metaInputs) {
          var convertedInputs = {};
          _.forEach(metaInputs, function(metaInput) {
            if (metaInput.name in convertedInputs) {
              throw {name: 'JscalcNameConflictError', message: metaInput.name};
            }
            if (metaInput.type == 'list') {
              convertedInputs[metaInput.name] = _.map(inputs[metaInput.id],
                  function(item) {
                    return convertInputs(item, metaInput.metaInputs);
                  });
            } else if (metaInput.type == 'date') {
              var dateMoment = jscalcDateInput.toDate(inputs[metaInput.id],
                  DEFAULTS.dateInputValueType);
              convertedInputs[metaInput.name] = dateMoment ?
                  dateMoment.toDate() : null;
            } else {
              convertedInputs[metaInput.name] = inputs[metaInput.id];
            }
          });
          return convertedInputs;
        };

        var convertUsedInputs = function(usedInputs, metaInputs) {
          var convertedUsedInputs = {};
          _.forEach(metaInputs, function(metaInput) {
            if (!(metaInput.name in usedInputs)) return;
            convertedUsedInputs[metaInput.id] =
                {used: usedInputs[metaInput.name].used};
            if (metaInput.type == 'list') {
              convertedUsedInputs[metaInput.id].properties =
                  _.mapValues(usedInputs[metaInput.name].properties,
                      function(item) {
                        return {
                          used: item.used,
                          properties: convertUsedInputs(item.properties,
                              metaInput.metaInputs)
                        };
                      });
            }
          });
          return convertedUsedInputs;
        };

        $scope.$watch('doc.script', function(script) {
          if (blobUrl) window.URL.revokeObjectURL(blobUrl);
          var hostUrl = $location.protocol() + '://' + $location.host();
          if ($location.port()) hostUrl += ':' + $location.port();
          blobUrl = window.URL.createObjectURL(new Blob([
            'var calculate = function(inputs) {' + script + '};\n\n' +
            'importScripts("' + hostUrl + '/bower_components/lodash/dist/lodash.min.js");\n' +
            'importScripts("' + hostUrl + '/bower_components/moment/min/moment.min.js");\n' +
            'importScripts("' + hostUrl + '/bower_components/mathjs/dist/math.min.js");\n' +
            'importScripts("' + hostUrl + '/js/worker.js");\n'
          ]));
          if (worker) destroyWorker();
          requestRecalculation();
        });

        var cancelCalculationTimeout = function() {
          if (calculationTimeoutPromise) {
            $timeout.cancel(calculationTimeoutPromise);
            calculationTimeoutPromise = null;
          }
        };

        var createWorker = function() {
          worker = new Worker(blobUrl);
          worker.onmessage = function(e) {
            $scope.$apply(function() {
              cancelCalculationTimeout();
              $scope.workerBuzy = false;
              if ('outputs' in e.data) {
                $scope.outputs = e.data.outputs;
                $scope.workerError = null;
              }
              $scope.usedInputs = convertUsedInputs(e.data.usedInputs,
                  $scope.doc.metaInputs);
            });
          };
          worker.onerror = function(e) {
            $scope.$apply(function() {
              e.preventDefault();
              cancelCalculationTimeout();
              $scope.workerError = {message: e.message};
              if (e.lineno) {
                $scope.workerError.lineNumber = e.lineno;
              }
              $scope.outputs = null;
            });
          }
        };

        var destroyWorker = function() {
          worker.terminate();
          worker = null;
          $scope.workerBuzy = false;
          $scope.workerError = null;
          cancelCalculationTimeout();
        };

        var startWorker = function() {
          if (!worker) {
            createWorker();
          }
          if ($scope.workerBuzy) {
            destroyWorker();
            createWorker();
          }
          try {
            var convertedInputs = convertInputs($scope.inputs,
                $scope.doc.metaInputs);
          } catch (e) {
            if (e.name != 'JscalcNameConflictError') {
              throw e;
            }
            $scope.workerError = {message: 'Multiple inputs have name "' + e.message + '".'};
            return;
          }
          calculationTimeoutPromise = $timeout(function() {
            $scope.workerError = {message: 'Calculation did not finish after 1 second. Is there an infinite loop?'};
            $scope.outputs = null;
          }, 1000);
          $scope.workerBuzy = true;
          worker.postMessage({
            inputs: convertedInputs
          });
        };

        var requestRecalculation = function() {
          if ($scope.debugMode) return;
          if (!recalculationScheduled) {
            recalculationScheduled = true;
            $timeout(function() {
              recalculationScheduled = false;
              startWorker();
            });
          }
        };

        $scope.$watch(function() {
          try {
            return convertInputs($scope.inputs,
                $scope.doc.metaInputs);
          } catch (e) {
            if (e.name != 'JscalcNameConflictError') {
              throw e;
            }
            return null;
          }
        }, requestRecalculation, true);

        $scope.toggleDebugMode = function() {
          $scope.debugMode = !$scope.debugMode;
          if (!$scope.debugMode) requestRecalculation();
        };

        $scope.calculate = startWorker;

        $scope.getInputTemplateName = function(metaInput) {
          var getType = function() {
            if (metaInput.type == 'binary') {
              return metaInput.presentationType;
            } else if (metaInput.type == 'choice') {
              return metaInput.presentationType;
            } else {
              return metaInput.type;
            }
          };
          return '/partials/input_' + getType();
        };

        $scope.updateDefaults = function() {
          if (!$scope.doc.defaults) {
            $scope.doc.defaults = {};
          }
          angular.copy($scope.inputs, $scope.doc.defaults);
          $mdToast.show({
            template: '<md-toast>Defaults set to current values.</md-toast>',
            hideDelay: 3000
          });
        };

        $scope.loadDefaults = function() {
          angular.copy($scope.doc.defaults, $scope.inputs);
        };

        $scope.showDefaultsButtons = function() {
          return !angular.equals($scope.doc.defaults || {}, $scope.inputs);
        };

        $scope.addItem = function(items, metaInput) {
          items.push(angular.copy(metaInput.itemPrototype));
        };

        $scope.deleteItem = function(items, index) {
          items.splice(index, 1);
        };
      }
    };
  }])
  .directive('jscalcDefault', function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        defaultValue: '='
      },
      link: function($scope, element, attr, ngModel) {
        function toUser(value) {
          if (!angular.isDefined(value) || value === null) {
            return $scope.defaultValue;
          }
          return value;
        }
        ngModel.$formatters.push(toUser);
      }
    };
  })
  .directive('jscalcNumberToString', function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function($scope, element, attr, ngModel) {
        function toUser(value) {
          return value.toString();
        }
        function fromUser(value) {
          return Number(value);
        }
        ngModel.$formatters.push(toUser);
        ngModel.$parsers.push(fromUser);
      }
    };
  })
  .directive('jscalcDateInput', ['jscalcDateInput', function(jscalcDateInput) {
    return {
      restrict: 'E',
      templateUrl: '/partials/jscalc_date_input',
      scope: {
        value: '=ngModel',
        defaultValueType: '@?'
      },
      compile: function(element, attr) {
        return {
          pre: function($scope, element, attr) {
            $scope.months = [
              {value: 0, label: 'Jan'},
              {value: 1, label: 'Feb'},
              {value: 2, label: 'Mar'},
              {value: 3, label: 'Apr'},
              {value: 4, label: 'May'},
              {value: 5, label: 'Jun'},
              {value: 6, label: 'Jul'},
              {value: 7, label: 'Aug'},
              {value: 8, label: 'Sep'},
              {value: 9, label: 'Oct'},
              {value: 10, label: 'Nov'},
              {value: 11, label: 'Dec'}
            ];

            $scope.units = [
              {value: 'days', label: 'Days'},
              {value: 'months', label: 'Months'},
              {value: 'years', label: 'Years'}
            ];

            $scope.getAbsoluteDate = function() {
              return jscalcDateInput.getAbsoluteDate($scope.value && $scope.value.params).toDate();
            };

            $scope.getType = function() {
              return ($scope.value && $scope.value.type) ||
                  $scope.defaultValueType;
            }

            $scope.toggleType = function() {
              var date = jscalcDateInput.toDate($scope.value,
                  $scope.defaultValueType);
              $scope.value.type = {'absolute': 'relative', 'relative': 'absolute'}[$scope.getType()];
              if (date) {
                if ($scope.getType() == 'absolute') {
                  $scope.value.params = {
                    day: date.date(),
                    month: date.month(),
                    year: date.year()
                  };
                } else {
                  $scope.value.params = {
                    delta: date.diff(moment().startOf('day'), 'days'),
                    units: 'days'
                  };
                }
              } else {
                $scope.value.params = {};
              }
            };
          }
        }
      }
    };
  }]);

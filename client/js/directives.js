'use strict';

/* Directives */

angular.module('jscalcDirectives', [])
  .directive('jscalcCalc', ['$mdToast', 'DEFAULTS', function($mdToast,
      DEFAULTS) {
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
        deleteInput: '&?'
      },
      link: function($scope, element, attr) {
        $scope.DEFAULTS = DEFAULTS;

        angular.copy($scope.doc.defaults || {}, $scope.inputs);

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
          return (value || $scope.defaultValue);
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

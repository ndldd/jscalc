'use strict';

/* Directives */

angular.module('jscalcDirectives', [])
  .directive('jscalcCalc', ['$mdToast', function($mdToast) {
    return {
      restrict: 'E',
      templateUrl: '/partials/calc',
      scope: {
        doc: '=',
        editMode: '=',
        addInput: '&?',
        addOutput: '&?',
        configureInput: '&?',
        deleteInput: '&?'
      },
      link: function($scope, element, attr) {
        $scope.inputs = angular.copy($scope.doc.defaults) || {};

        $scope.getInputTemplateName = function(metaInput) {
          var getType = function() {
            if (metaInput.type == 'choice') {
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
  });

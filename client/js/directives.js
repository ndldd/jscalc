'use strict';

/* Directives */

angular.module('jscalcDirectives', [])
  .directive('jscalcCalc', function() {
    return {
      restrict: 'E',
      templateUrl: '/partials/calc',
      scope: {
        doc: '=',
        editMode: '=',
        addInput: '&',
        addOutput: '&'
      }
    };
  })
  .directive('jscalcDefault', function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        defaultValue: '='
      },
      link: function(scope, element, attr, ngModel) {
        function toUser(value) {
          return (value || scope.defaultValue);
        }
        ngModel.$formatters.push(toUser);
      }
    };
  })
  .directive('jscalcNumberToString', function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attr, ngModel) {
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

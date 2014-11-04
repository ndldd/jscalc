'use strict';

/* Directives */

angular.module('jscalcDirectives', [])
  .directive('jscalcCalc', function() {
    return {
      restrict: 'E',
      templateUrl: '/partials/calc',
      scope: {
        doc: '=doc',
        editMode: '=editMode'
      }
    };
  })

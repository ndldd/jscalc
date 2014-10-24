'use strict';

/* Controllers */

var jscalcControllers = angular.module('jscalcControllers', []);

jscalcControllers.controller('JscalcCtrl', [
  '$scope',
  '$location',
  '$materialSidenav',
  '$timeout',
  function($scope, $location, $materialSidenav, $timeout) {
    $scope.newCalcId = 'new';

    $scope.isCurrentLocation = function(location) {
      return location === $location.path();
    };

    $scope.toggleNav = function() {
      $timeout(function() {
        $materialSidenav('left').toggle();
      });
    };
  }]);

jscalcControllers.controller('EditCtrl', ['$scope', '$routeParams', '$timeout',
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

jscalcControllers.controller('CalculatorCtrl', ['$scope',
  function($scope) {
  }]);

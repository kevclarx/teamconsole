var app = angular.module('tcApp', ['ngRoute', 'ui.tree']);

app.config(function ($routeProvider) {
    
    $routeProvider
    .when('/', {
        templateUrl: 'console.html',
        controller: 'consoleController'
    })
    .when('/login', {
        templateUrl: 'login.html',
        controller: 'loginController'
    })
    
}); 

app.controller('consoleController', ['$scope', '$log', '$http', function($scope, $log, $http) {
    
    $scope.currentUser = "";

   $http.get('/api/nodes')
    .success(function(data) {
        $scope.data = data;
    })
    .error(function(status) {
        $log.log(status);
    }); 

     $scope.toggle = function(scope) {
        alert("scope triggered");
        scope.toggle();
      };


    $scope.remove = function(scope) {
        scope.remove();
      };

      $scope.newSubItem = function(scope) {
        var nodeData = scope.$modelValue;
        nodeData.nodes.push({
          id: nodeData.id * 10 + nodeData.nodes.length,
          name: nodeData.name + '.' + (nodeData.nodes.length + 1),
          nodes: []
        });
      };

      $scope.setCurrent = function(node){
        $scope.currentNode = node;
      };

      $scope.sshclient = function() {
        var url = "chrome-extension://pnhechapfaindjhompbnflcldabbghjo/html/nassh.html#" + $scope.currentUser + "@" + $scope.currentNode.ipaddress;
        window.open(url);
      };

    
}]);

app.controller('loginController', ['$scope', '$log', function($scope, $log) {
    
    $scope.name = 'login';
    
}]);

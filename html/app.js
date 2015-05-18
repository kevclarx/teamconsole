var app = angular.module('tcApp', ['ngRoute', 'ui.tree', 'ui.bootstrap']);

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

app.controller('consoleController', ['$scope', '$log', '$http', '$modal', function($scope, $log, $http, $modal) {
    
   $scope.currentUser = "";
   $scope.editMode = false;

   $http.get('/api/nodes')
    .success(function(data) {
        $scope.data = [{"id":0,"parentid": -1,"name": "root", "desc":"", "notes":"", "consoles": [], "nodes": [] }];
        data.forEach(function(node) {
            addNode($scope.data[0], node);
        });
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

      $scope.setCurrentNode = function(node){
        $scope.currentNode = node;
      };


    var sshclient = function(console, user) {
        var url = "chrome-extension://pnhechapfaindjhompbnflcldabbghjo/html/nassh.html#" + user + "@" + console.ipaddress + ":" + console.port;
        window.open(url);
      };

    var addNode = function(root, node) {
        if(!root.nodes) {
            root.nodes = [];
        }
        if(root.id === node.parentid) { 
            root.nodes.push(node);
        } else {
            root.nodes.forEach(function(child) {
                addNode(child, node);
            });
        }
    };

    $scope.addConsole = function(scope) {
        $scope.editMode = true;
        $scope.currentNode.consoles.push({name:"", ipaddress:"", type: "0", port: "22"});
    };

    $scope.removeConsole = function(console) {
        $scope.currentNode.consoles.splice($scope.currentNode.consoles.indexOf(console), 1);
    };

    $scope.openConsole = function (size, console) {
        if($scope.editMode) {
            return;
        }

        if(console.type == 0) {

            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'SSHModal.html',
                controller: 'ModalInstanceCtrl',
                size: size,
                resolve: {
                    user: function () {
                        return $scope.currentUser;
                    }
                }
            });

            modalInstance.result.then(function (user) {
                $scope.currentUser = user;
                sshclient(console, user);
            }, function () {
                //$log.info('Modal dismissed at: ' + new Date());
            });
        } else {     
            window.open(console.ipaddress + ":" + console.port);
        }
    };
    
}]);

app.controller('loginController', ['$scope', '$log', function($scope, $log) {
    
    $scope.name = 'login';
    
}]);

app.controller('ModalInstanceCtrl', function ($scope, $modalInstance, user) {

  $scope.user = user;
  

  $scope.ok = function () {
    $modalInstance.close($scope.user);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});



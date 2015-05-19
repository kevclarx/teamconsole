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
    $scope.currentNodeCopy = {};

    var nodeListAll = function() {
        $http.get('/api/nodes')
        .success(function(data, status, headers, config) {
            $scope.data = [{"id":0,"parentid": -1,"name": "root", "desc":"", "notes":"", "consoles": [], "nodes": [] }];
            data.forEach(function(node) {
                addNode($scope.data[0], node);
            });
        })
        .error(function(data, status, headers, config) {
            $log.log(status);
        }); 
    };

    var nodeUpdate = function() {
        $scope.currentNode.consoles.forEach(function(console) {
            console.port = parseInt(console.port);
            console.type = parseInt(console.type);
        });

        $http.post('/api/nodes/' + $scope.currentNode.id, $scope.currentNode)
        .success(function(data, status, headers, config) {
            // placeholder
        })
        .error(function(data, status, headers, config) {
            $log.log(status);
            $log.log(data);
        }); 
    };

    $scope.nodeCreate = function(scope) {
        var nodeData = scope.$modelValue;

        var node = {
            name: "blank",
            id: 0,
            parentid: nodeData.id,
            desc: "",
            consoles: []
        };

        $http.put('/api/node/', node)
        .success(function(data, status, headers, config) {
            node = data;
            scope.expand();
            addNode(nodeData,node);
            $scope.currentNode = node;
            $scope.editMode = true;
        })
        .error(function(data, status, headers, config) {
            $log.log(status);
        }); 
    };

    $scope.nodeDelete = function(scope) {
        var node = scope.$modelValue;

        // safeguard against someone deleting large number of objects under a tree
        if(node.hasOwnProperty("nodes")) {
            if(node.nodes.length > 0) {
                return;
            }
        }

        $http.delete('/api/nodes/' + node.id)
        .success(function(data) {
            scope.remove();
            $scope.currentNode = {};
        })
        .error(function(status) {
            $log.log(status);
        }); 
    };

    // Grab all the node data on start
    nodeListAll();

    $scope.setCurrentNode = function(node){
        if($scope.editMode) {
            console.log("undoing changes");
            $scope.undoChanges();
        }
        $scope.currentNode = node;
    };


    sshclient = function(console, user) {
        var url = "chrome-extension://pnhechapfaindjhompbnflcldabbghjo/html/nassh.html#" + user + "@" + console.ipaddress + ":" + console.port;
        window.open(url);
    };

    addNode = function(root, node) {
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

    // Copy snapshot of current node but only if copy does not already exist
    $scope.copyNode = function() {
        if(Object.keys($scope.currentNodeCopy).length === 0) {
            nodecopy($scope.currentNode, $scope.currentNodeCopy);
        }
    };

    $scope.addConsole = function(scope) {
        $scope.editMode = true;
        $scope.copyNode();
        $scope.currentNode.consoles.push({name:"", ipaddress:"", type: 0, port: 22});
    };

    $scope.removeConsole = function(console) {
        $scope.currentNode.consoles.splice($scope.currentNode.consoles.indexOf(console), 1);
    };

    $scope.undoChanges = function() {
        // revert back to object copy we took before changes
        nodecopy($scope.currentNodeCopy,$scope.currentNode);
        $scope.currentNodeCopy = {};
        $scope.editMode = false;
    };

    $scope.saveChanges = function() {
        $scope.currentNodeCopy = {};
        nodeUpdate();
        $scope.editMode = false;
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

    nodecopy = function(src, dst) {
        dst.id = src.id;
        dst.parentid = src.parentid;
        dst.name = src.name;
        dst.desc = src.desc;
        dst.notes = src.notes;

        dst.consoles = [];

        src.consoles.forEach(function(console) {
            consoleCopy = {
                name: console.name,
                ipaddress: console.ipaddress,
                type: console.type,
                port: console.port
            };
            dst.consoles.push(consoleCopy);
        });
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



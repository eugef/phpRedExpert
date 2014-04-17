App.controller('KeyController', ['$scope', '$routeParams', '$location', 'RedisService',
    function ($scope, $routeParams, $location, RedisService) {
        console.log('KeyController');
        console.log($routeParams);

        $scope.key = {};
        $scope.alerts = [];
        
        $scope.addKey = function(keyType) {
            console.log('addKey');
            $scope.key = {
                new: true,
                type: keyType,
                ttl: 0
            }
        }

        $scope.editKey = function(keyName) {
            console.log('editKey');
            return RedisService.getKeyValue($scope.current.serverId, $scope.current.dbId, keyName).then(
                function(response) {
                    $scope.key = response.data.key;
                    $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl; 
                    console.log($scope.key)
                    console.log('// editKey');
                }
            );    
        }
        
        $scope.submitKey = function() {
            if ($scope.key.new) {
                console.log('submitKey: add');
                return RedisService.addKey($scope.current.serverId, $scope.current.dbId, $scope.key).then(
                    function(response) {
                        $scope.key.new = false;
                        $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/key/view/' + encodeURIComponent($scope.key.name), false);
                        $scope.alerts.push({type: 'success', message: 'Key is succesfully created'});
                        console.log('// submitKey / add');
                    }
                );
            }
            else {
                console.log('submitKey: edit');
                return RedisService.editKey($scope.current.serverId, $scope.current.dbId, $scope.key).then(
                    function(response) {
                        $scope.alerts.push({type: 'success', message: 'Key is succesfully updated'});
                        console.log('// submitKey / edit');
                    }
                );
            }
        }
        
        $scope.editKeyTtl = function() {
            console.log('editKeyTtl');
                
            $scope.$parent.showModal('ModalEditKeyAttributeController', 'editkeyttl.html',                  
                {
                    value: $scope.key.ttl,
                    key: $scope.key.name
                }
            ).result.then(function(newTtl) {
                RedisService.editKeyAttributes($scope.current.serverId, $scope.current.dbId, $scope.key.name, {ttl: newTtl}).then(
                    function(response) {
                        $scope.key.ttl = newTtl;
                        console.log('editKeyTtl / done');
                    }
                );
            });
            
        }  
        
        $scope.editKeyName = function() {
            console.log('editKeyName');
            
            $scope.$parent.showModal('ModalEditKeyAttributeController', 'editkeyname.html',                 
                {
                    value: $scope.key.name,
                    key: $scope.key.name
                }
            ).result.then(function(newName) {
                if (newName != $scope.key.name) {
                    RedisService.editKeyAttributes($scope.current.serverId, $scope.current.dbId, $scope.key.name, {name: newName}).then(
                        function(response) {
                            if (response.data.result.name) {
                                $scope.key.name = newName;
                                // update key name in url
                                $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/key/' + encodeURIComponent($scope.key.name), false);
                            }
                            else {
                                $scope.$parent.showModalAlert({
                                    title: 'Rename error!',
                                    message: 'Could not rename key "' + $scope.key.name + '" to "' + newName + '"'
                                });
                            }

                            console.log('editKeyName / done');
                        }
                    );
                }
            });
            
        } 
        
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
        
        $scope.init($routeParams.serverId, $routeParams.dbId).then(function() {
            if (angular.isDefined($routeParams.key)) {
                $scope.$parent.view = {
                    title: 'View key',
                    subtitle: $routeParams.key,
                };
            
                $scope.editKey($routeParams.key);
            }
            else {
                $scope.$parent.view = {
                    title: 'Add key',
                    subtitle: $routeParams.type,
                };
                
                $scope.addKey($routeParams.type);
            }
            
        });        
    }
]);


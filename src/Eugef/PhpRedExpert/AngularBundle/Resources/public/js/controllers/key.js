App.controller('KeyController', ['$scope', '$routeParams', '$location', '$log', 'RedisService',
    function ($scope, $routeParams, $location, $log, RedisService) {
        "use strict";

        $log.debug('KeyController', $routeParams);

        $scope.key = {};
        $scope.keyValue = {};
        $scope.alerts = [];

        $scope.initCreateKey = function (keyType) {
            $log.debug('initCreateKey', arguments);

            $scope.key = {
                new: true,
                type: keyType,
                ttl: 0
            };

            $scope.keyValue = $scope.defaultKeyValue(keyType);
        };

        $scope.initUpdateKey = function (keyName) {
            $log.debug('initUpdateKey', arguments);

            return RedisService.viewKey($scope.servers.current().id, $scope.servers.current().databaseCurrent().id, keyName).then(
                function (response) {
                    $scope.key = response.data.key;
                    $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl;

                    $scope.keyValue = $scope.defaultKeyValue($scope.key.type, $scope.key.value);

                    $log.debug('initUpdateKey / done', $scope.key);
                },
                function (response) {
                    // key not found - add its name for warning message
                    $scope.key = {
                        name: keyName
                    };
                }
            );
        };

        $scope.defaultKeyValue = function (keyType, value) {
            switch (keyType) {
                case 'string':
                    return {
                        value: angular.isDefined(value) ? value : ''
                    };
                case 'hash':
                    return {
                        field: '',
                        value: ''
                    };
                case 'list':
                    return {
                        value: '',
                        action: 'append',
                        pivot: '',
                        index: null
                    };
                case 'set':
                    return {
                        value: ''
                    };
                case 'zset':
                    return {
                        score: 0,
                        value: ''
                    };
            }
        };

        $scope.submitKey = function () {
            var key = {
                name: $scope.key.name,
                type: $scope.key.type,
                ttl: $scope.key.ttl,
                value: $scope.keyValue
            };

            if ($scope.key.new) {
                $log.debug('submitKey: add');

                return RedisService.createKey($scope.servers.current().id, $scope.servers.current().databaseCurrent().id, key).then(
                    function (response) {
                        $scope.key = response.data.key;
                        $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl;
                        $scope.keyValue = $scope.defaultKeyValue($scope.key.type, $scope.key.value);

                        // increase amount of keys in whole db
                        $scope.$parent.servers.current().databaseCurrent().keys++;

                        // change location for new key
                        $location.path('server/' + $scope.servers.current().id + '/db/' + $scope.servers.current().databaseCurrent().id + '/key/view/' + $scope.key.name, false);

                        $log.debug('submitKey: add / done', $scope.key);
                    },
                    function (response) {
                        $scope.alerts.push({type: 'danger', message: 'Key is not created'});
                    }
                );
            }
            else {
                $log.debug('submitKey: edit');

                return RedisService.updateKeyValues($scope.servers.current().id, $scope.servers.current().databaseCurrent().id, key).then(
                    function (response) {
                        $scope.key = response.data.key;
                        $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl;
                        $scope.keyValue = $scope.defaultKeyValue($scope.key.type, $scope.key.value);

                        $log.debug('submitKey: edit / done', $scope.key);
                    },
                    function (response) {
                        $scope.alerts.push({type: 'danger', message: 'Key is not updated'});
                    }
                );
            }
        };

        $scope.initEditHashField = function (field) {
            $scope.keyValue = {
                field: field,
                value: $scope.key.value[field]
            };
        };

        $scope.initEditListItem = function (index) {
            $scope.keyValue = {
                action: 'set',
                value: $scope.key.value[index],
                index: index,
                pivot: ''
            };
        };

        $scope.isKeyListValueAction = function (actions) {
            return actions.indexOf($scope.keyValue.action) != -1;
        };

        $scope.deleteKeyValue = function (value) {
            $log.debug('deleteKeyValue', arguments);

            var execute = function () {
                return RedisService.deleteKeyValues($scope.servers.current().id, $scope.servers.current().databaseCurrent().id, key).then(
                    function (response) {
                        if (response.data.key) {
                            //update key
                            $scope.key = response.data.key;
                            $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl;

                            $log.debug('deleteKeyValue / done', $scope.key);
                        }
                        else {
                            //remove key from scope
                            $scope.key = {
                                name: key.name
                            };

                            // reduce amount of keys in whole db
                            $scope.$parent.servers.current().databaseCurrent().keys--;

                            $scope.alerts.push({type: 'success', message: 'Key is successfully deleted'});

                            $log.debug('deleteKeyValue / done / whole key');
                        }
                    },
                    function (response) {
                        $scope.alerts.push({type: 'danger', message: 'Key item is not deleted'});
                    }
                );
            };

            var key = {
                name: $scope.key.name,
                type: $scope.key.type,
                value: {
                    delete: [value]
                }
            };

            if ($scope.key.size > 1) {
                execute();
            }
            else {
                $scope.$parent.showModalConfirm({
                    title: 'Delete key forever?',
                    message: 'Key is about to be permanently deleted because no values are left:',
                    items: [key.name],
                    warning: 'You can\'t undo this action!',
                    action: 'Delete'
                }).result.then(function () {
                        execute();
                    });
            }
        };

        $scope.editKeyTtl = function () {
            $log.debug('editKeyTtl');

            $scope.$parent.showModal('ModalEditKeyAttributeController', 'editkeyttl.html',
                {
                    value: $scope.key.ttl,
                    key: $scope.key.name
                }
            ).result.then(function (newTtl) {
                    RedisService.expireKey($scope.servers.current().id, $scope.servers.current().databaseCurrent().id, $scope.key.name, newTtl).then(
                        function (response) {
                            $log.debug('editKeyTtl / done', response.data);

                            $scope.key.ttl = newTtl;
                        }
                    );
                });
        };

        $scope.editKeyName = function () {
            $log.debug('editKeyName');

            $scope.$parent.showModal('ModalEditKeyAttributeController', 'editkeyname.html',
                {
                    value: $scope.key.name,
                    key: $scope.key.name
                }
            ).result.then(function (newName) {
                    if (newName != $scope.key.name) {
                        RedisService.renameKey($scope.servers.current().id, $scope.servers.current().databaseCurrent().id, $scope.key.name, newName).then(
                            function (response) {
                                $log.debug('editKeyName / done', response.data);

                                if (response.data.result) {
                                    $scope.key.name = newName;
                                    $scope.setViewTitle(newName);
                                    // update key name in url
                                    $location.path('server/' + $scope.servers.current().id + '/db/' + $scope.servers.current().databaseCurrent().id + '/key/view/' + $scope.key.name, false);
                                }
                                else {
                                    $scope.$parent.showModalAlert({
                                        title: 'Rename error!',
                                        message: 'Could not rename key "' + $scope.key.name + '" to "' + newName + '"'
                                    });
                                }
                            }
                        );
                    }
                });
        };

        $scope.deleteKey = function () {
            $log.debug('deleteKey');

            $scope.$parent.showModalConfirm({
                title: 'Delete key forever?',
                message: 'Key is about to be permanently deleted:',
                items: [$scope.key.name],
                warning: 'You can\'t undo this action!',
                action: 'Delete'
            }).result.then(function () {
                    RedisService.deleteKeys($scope.servers.current().id, $scope.servers.current().databaseCurrent().id, [$scope.key.name]).then(
                        function (response) {
                            $log.debug('deleteKey / done', response.data);

                            //remove key from scope
                            $scope.key = {
                                name: $scope.key.name
                            };

                            // reduce amount of keys in whole db
                            $scope.$parent.servers.current().databaseCurrent().keys -= response.data.result;

                            $scope.alerts.push({type: 'success', message: 'Key is successfully deleted'});
                        }
                    );
                });
        };

        $scope.moveKey = function () {
            $log.debug('moveKey');

            $scope.$parent.showModal('ModalEditKeyAttributeController', 'movekeys.html',
                {
                    title: 'Move the key?',
                    message: 'Key is about to be moved:',
                    items: [$scope.key.name],
                    databases: $scope.$parent.servers.current().databases
                }
            ).result.then(function (newDB) {
                    RedisService.moveKeys($scope.servers.current().id, $scope.servers.current().databaseCurrent().id, [$scope.key.name], newDB).then(
                        function (response) {
                            $log.debug('moveKey / done', response.data);

                            //remove key from scope
                            $scope.key = {
                                name: $scope.key.name
                            };

                            // reduce amount of keys in current db
                            $scope.$parent.servers.current().databaseCurrent().keys -= response.data.result;

                            // increase amount of keys in a new db
                            $scope.$parent.servers.current().databaseById(newDB).keys += response.data.result;

                            $scope.alerts.push({type: 'success', message: 'Key is successfully moved'});
                        }
                    );
                });
        };

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };

        $scope.setViewTitle = function (keyName, keyType) {
            var subtitle = '';
            if (angular.isDefined(keyName)) {
                subtitle = 'View key "' + keyName + '"';
            } else if (angular.isDefined(keyType)) {
                subtitle = 'Create ' + keyType + ' key';
            }

            $scope.$parent.view = {
                title: $scope.$parent.servers.current().databaseCurrent().name,
                subtitle: subtitle
            };
        };

        $scope.init($routeParams.serverId, $routeParams.dbId).then(function () {
            $log.debug('KeyController.init');

            if (angular.isDefined($routeParams.key)) {
                $scope.setViewTitle($routeParams.key);
                $scope.initUpdateKey($routeParams.key);
            }
            else {
                $scope.setViewTitle(null, $routeParams.type);
                $scope.initCreateKey($routeParams.type);
            }
        });
    }
]);

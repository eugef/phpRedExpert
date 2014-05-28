App.controller('ModalConfirmController', ['$scope', '$modalInstance', '$log', 'settings',
    function ($scope, $modalInstance, $log, settings) {
        $log.debug('ModalConfirmController', settings);
        
        $scope.data = settings;
        $scope.data.action = angular.isDefined(settings.action) ? settings.action : 'Ok'
        
        $scope.ok = function() {
            $modalInstance.close();
        };

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };      
    }
]);

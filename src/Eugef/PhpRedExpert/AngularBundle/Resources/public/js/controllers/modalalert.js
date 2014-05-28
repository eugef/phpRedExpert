App.controller('ModalAlertController', ['$scope', '$modalInstance', '$log', 'settings',
    function ($scope, $modalInstance, $log, settings) {
        $log.debug('ModalAlertController', settings);
        
        $scope.data = settings;
        
        $scope.ok = function() {
            $modalInstance.dismiss('cancel');
        };
    }
]);

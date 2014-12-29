App.controller('ModalAlertController', ['$scope', '$modalInstance', '$log', 'settings',
    function ($scope, $modalInstance, $log, settings) {
        "use strict";

        $log.debug('ModalAlertController', settings);

        $scope.data = settings;

        $scope.ok = function () {
            $modalInstance.dismiss('cancel');
        };
    }
]);

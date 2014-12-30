App.directive('togglesidebar', ['$window',
    function ($window) {
        "use strict";

        return {
            restrict: 'A',

            /**
             * @param {Scope} scope
             * @param {jQuery} element
             */
            link: function (scope, element) {
                element.bind('click', function (event) {
                    event.preventDefault();

                    // If window is small enough, enable sidebar push menu
                    if ($window.innerWidth <= 992) {
                        angular.element(document.querySelector('.row-offcanvas')).toggleClass('active');
                        angular.element(document.querySelector('.left-side')).removeClass('collapse-left');
                        angular.element(document.querySelector('.right-side')).removeClass('strech');
                        angular.element(document.querySelector('.row-offcanvas')).toggleClass('relative');
                    } else {
                        // Else, enable content stretching
                        angular.element(document.querySelector('.left-side')).toggleClass('collapse-left');
                        angular.element(document.querySelector('.right-side')).toggleClass('strech');
                    }
                });
            }
        }
    }
]);

App.directive('menutree', ['$timeout',
    function ($timeout) {
        "use strict";

        return {
            restrict: 'A',

            /**
             * @param {Scope} scope
             * @param {jQuery} element
             */
            link: function (scope, element) {
                /**
                 * @type {jQuery}
                 */
                var link = angular.element(element.children()[0]);

                // Open or close the menu on link click
                link.bind('click', function (event) {
                    event.preventDefault();
                    if (element.hasClass('active')) {
                        element.removeClass('active').removeClass('animate');
                    } else {
                        element.addClass('active').addClass('animate');
                        //animate on open
                        $timeout(
                            function () {
                                element.removeClass('animate');
                            },
                            700
                        );
                    }
                });

            }
        }
    }
]);            
        
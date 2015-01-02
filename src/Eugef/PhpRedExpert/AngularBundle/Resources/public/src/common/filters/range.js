App.filter('range',
    function () {
        "use strict";

        /**
         * @param {Array} input
         * @param {String|Number} min
         * @param {String|Number} max
         * @returns {Array}
         */
        function filter(input, min, max) {
            min = parseInt(min, 10);
            max = parseInt(max, 10);
            for (var i = min; i < max; i++) {
                input.push(i);
            }

            return input;
        }

        return filter;
    }
);

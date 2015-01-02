App.factory('DatabaseModel', [
    function () {
        "use strict";

        /**
         * @constructor
         * @param {Array} data
         * @param {Number} data.id
         * @param {String} data.name
         * @param {Number} data.keys
         * @param {Number} data.expires
         * @param {Boolean|Number} data.default
         */
        function Database(data) {
            /**
             * @type {Number}
             */
            var id = parseInt(data.id) || 0;

            /**
             * @type {String}
             */
            var name = name || '';

            /**
             * @type {Number}
             */
            var keys = parseInt(data.keys) || 0;

            /**
             * @type {Number}
             */
            var expires = parseInt(data.expires) || 0;

            /**
             * @type {Boolean}
             */
            var isDefault = !!data.default;

            /**
             * @type {Boolean}
             */
            var isCurrent = false;

            /**
             * @type {Boolean}
             */
            var isForceVisible = false;

            /**
             * @type {Number}
             * @readonly
             */
            Object.defineProperty(this, 'id', {
                enumerable: true,
                get: function () {
                    return id;
                }
            });

            /**
             * @type {String}
             * @readonly
             */
            Object.defineProperty(this, 'name', {
                enumerable: true,
                get: function () {
                    return name ? name : 'DB ' + id;
                }
            });

            /**
             * @type {Number}
             */
            Object.defineProperty(this, 'keys', {
                enumerable: true,
                get: function () {
                    return keys;
                },
                set: function (value) {
                    keys = value;
                }
            });

            /**
             * @type {Boolean}
             * @readonly
             */
            Object.defineProperty(this, 'isEmpty', {
                enumerable: true,
                get: function () {
                    return keys == 0;
                }
            });

            /**
             * @type {Number}
             * @readonly
             */
            Object.defineProperty(this, 'expires', {
                enumerable: true,
                get: function () {
                    return expires;
                }
            });

            /**
             * @type {Boolean}
             */
            Object.defineProperty(this, 'isCurrent', {
                enumerable: true,
                get: function () {
                    return isCurrent;
                },
                set: function (value) {
                    isCurrent = value;

                    if (isCurrent) {
                        isForceVisible = true;
                    }
                }
            });

            /**
             * @type {Boolean}
             * @readonly
             */
            Object.defineProperty(this, 'isDefault', {
                enumerable: true,
                get: function () {
                    return isDefault;
                }
            });

            /**
             * @type {Boolean}
             * @readonly
             */
            Object.defineProperty(this, 'isVisible', {
                enumerable: true,
                get: function () {
                    return isForceVisible || keys > 0 || isDefault || id == 0;
                }
            });
        }

        return Database;
    }
]);

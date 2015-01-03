App.factory('ServerModel', ['DatabaseModel',
    function (Database) {
        "use strict";

        /**
         * @constructor
         * @param {Array} data
         * @param {Number} data.id
         * @param {String} data.name
         * @param {String} data.host
         * @param {Number} data.port
         * @param {Boolean|Number} data.password
         */
        function Server(data) {
            /**
             * @type {Number}
             */
            var id = parseInt(data.id) || 0;

            /**
             * @type {String}
             */
            var name = data.name || '';

            /**
             * @type {String}
             */
            var host = data.host || '';

            /**
             * @type {Number}
             */
            var port = parseInt(data.port) || 0;

            /**
             * @type {Boolean}
             */
            var hasPassword = !!data.password;

            /**
             * @type {Database[]}
             */
            var databases = [];

            /**
             * @type {Object}
             */
            var info = {};

            /**
             * @type {Object}
             */
            var config = {};

            /**
             * @returns {Number}
             */
            var databaseIndexDefault = function () {
                for (var i = 0; i < databases.length; i++) {
                    if (databases[i].isDefault) {
                        return i;
                    }
                }

                return 0;
            };

            /**
             * @type {Number}
             */
            var databaseIndexCurrent = databaseIndexDefault();

            /**
             * @param {Number} id
             * @returns {Number|null}
             */
            var databaseIndexById = function (id) {
                for (var i = 0; i < databases.length; i++) {
                    if (databases[i].id == id) {
                        return i;
                    }
                }

                return null;
            };

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
                    return name ? name : host + ':' + port;
                }
            });

            /**
             * @type {String}
             * @readonly
             */
            Object.defineProperty(this, 'host', {
                enumerable: true,
                get: function () {
                    return host;
                }
            });

            /**
             * @type {Number}
             * @readonly
             */
            Object.defineProperty(this, 'port', {
                enumerable: true,
                get: function () {
                    return port;
                }
            });

            /**
             * @type {Boolean}
             * @readonly
             */
            Object.defineProperty(this, 'hasPassword', {
                enumerable: true,
                get: function () {
                    return hasPassword;
                }
            });

            /**
             * @type {Database[]}
             * @readonly
             */
            Object.defineProperty(this, 'databases', {
                enumerable: true,
                get: function () {
                    return databases;
                },
                set: function (dataList) {
                    databases = [];

                    dataList.forEach(function (data) {
                        databases.push(
                            new Database(data)
                        );
                    });
                }
            });

            /**
             * @type {Object}
             */
            Object.defineProperty(this, 'info', {
                enumerable: true,
                get: function () {
                    return info;
                },
                set: function (value) {
                    info = value;
                }
            });

            /**
             * @type {Object}
             */
            Object.defineProperty(this, 'config', {
                enumerable: true,
                get: function () {
                    return config;
                },
                set: function (value) {
                    config = value;
                }
            });

            /**
             * @param {Number} id
             * @returns {Database|null}
             */
            this.databaseById = function (id) {
                var index = databaseIndexById(id);

                if (index !== null) {
                    return databases[index];
                } else {
                    return null;
                }
            };

            /**
             * @param {Number} id
             * @returns {Boolean}
             */
            this.databaseExists = function (id) {
                return databaseIndexById(id) !== null;
            };

            /**
             * @returns {Database}
             */
            this.databaseDefault = function () {
                return databases[databaseIndexDefault()];
            };

            /**
             * @param {Number} [id]
             * @returns {Database}
             */
            this.databaseCurrent = function (id) {
                if (id !== undefined) {
                    var index = databaseIndexById(id);

                    if (index !== null) {
                        databaseIndexCurrent = index;
                    } else {
                        databaseIndexCurrent = databaseIndexDefault();
                    }

                    for (var i = 0; i < databases.length; i++) {
                        databases[i].isCurrent = (i == databaseIndexCurrent);
                    }
                }

                return databases[databaseIndexCurrent];
            }
        }

        return Server;
    }
]);

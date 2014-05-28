"use static";

/**
 * A simple logging system.
 *
 * Three modes are provided: 'log', 'error' and 'debug'.
 *
 * Do not think of this as an alternative to console.log. If you want to write
 * to the console, use that. This is if you want something more complicated on
 * top, which is specifically for logging.
 */

(function() {

    /**
     * Used to handle the binding of 'here is a log message' to 'should we give
     * it to the onLog subset'. Looks up if the type of message is enabled or
     * not, and if it is, passes it on.
     *
     * This is a function to keep it out of the Logger API.
     */
    var handleLog = function( type, any, modes, onLog, msgs, startI ) {
        if ( any || (modes.hasOwnProperty(type) && modes[type] === true) ) {
            if ( startI === 0 ) {
                onLog( type, msgs );
            } else {
                if ( startI >= msgs.length ) {
                    onLog( type, [] );
                } else {
                    var arr = new Array( msgs.length - startI );

                    for ( var i = startI; i < msgs.length; i++ ) {
                        arr[ i - startI ] = msgs[ i ]
                    }

                    onLog( type, arr );
                }
            }
        }
    }



    /**
     * @onLog Optional, the function to handle how the logging messages are
     *        displayed.
     */
    var Logger = function( onLog ) {
        if ( onLog === undefined ) {
            onLog = function( type, msgs ) {
                type = " " + "\t";
                var temp = null;

                if ( msgs.length > 1 ) {
                    temp = new Array( msgs.length+1 );

                    temp[ 0 ] = type;
                    for ( var i = 0; i < msgs.length; i++ ) {
                        temp[ i + 1 ] = msgs[ i ];
                    }
                }

                if ( type === 'error' ) {
                    if ( msgs.length === 0 ) {
                        console.error( type );
                    } else if ( msgs.length === 1 ) {
                        console.error( type, msgs[0] );
                    } else {
                        console.error.apply( console, temp );
                    }
                } else {
                    if ( msgs.length === 0 ) {
                        console.log( type );
                    } else if ( msgs.length === 1 ) {
                        console.log( type, msgs[0] );
                    } else {
                        console.log.apply( console, temp );
                    }
                }
            };
        }

        this.onLog = onLog;
        this.anyMode = false;
        this.modes = {
                error     : true,
                log     : true,
                debug   : false
        };
    }

    Logger.prototype = {
        /**
         * Enables for any message to be logged, regardless of message.
         * This is useful for turning on a debug mode.
         */
        enableAny: function() {
            this.anyMode = true;
            return this;
        },

        /**
         * Disables the 'any' mode which is enabled with 'enableAny'. It will
         * not change the state of any modes indevidually enabled or disabled.
         */
        disableAny: function() {
            this.anyMode = false;
            return this;
        },



        enableMode: function(mode) {
            this.modes[mode] = true;
            return this;
        },

        enableDebug: function() {
            return this.enableMode( 'debug' );
        },

        enableLog: function() {
            return this.enableMode( 'log' );
        },

        enableerror: function() {
            return this.enableMode( 'error' );
        },



        disableMode: function(mode) {
            this.modes[mode] = false;
            return this;
        },

        disableDebug: function() {
            return this.disableMode( 'debug' );
        },

        disableLog: function() {
            return this.disableMode( 'log' );
        },

        disableError: function() {
            return this.disableMode( 'error' );
        },



        /**
         * Posts messages for the type given.
         *
         * Any type can be provided.
         */
        post: function(type) {
            handleLog( type.toLowerCase(), this.anyMode, this.modes, this.onLog, arguments, 1 );
            return this;
        },

        debug: function() {
            handleLog( 'debug', this.anyMode, this.modes, this.onLog, arguments, 0 );
            return this;
        },

        error: function() {
            handleLog( 'error', this.anyMode, this.modes, this.onLog, arguments, 0 );
            return this;
        },

        log: function() {
            handleLog( 'log', this.anyMode, this.modes, this.onLog, arguments, 0 );
            return this;
        }
    }


    
    // exports
    global.Logger = Logger;

})();


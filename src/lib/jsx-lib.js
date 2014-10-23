"use strict";

/**
 * jsx-lib.js
 *
 * This includes all the stuff needed to run JSX as an imported
 * library into a project. For example to run JSX files from
 * their script tags.
 */
(function() {
    /**
     * Used to keep the callbacks to compile and execute the JSX code in order.
     */
    var scriptOrderArray = [];

    jsx.executeScripts = function() {
        setTimeout( function() {
            var scripts = document.getElementsByTagName( 'script' );

            for ( var i = 0; i < scripts.length; i++ ) {
                var src = scripts[i].getAttribute( 'src' );
                var type = scripts[i].getAttribute('type');

                if ( src ) {
                    if ( isJSXScriptType(type) ) {
                        jsx.executeUrl( src );
                   }
                } else if ( isJSXScriptType(type) ) {
                    jsx.executeCode( script.innerHTML );
                }
            }
        }, 0 );
    }

    jsx.executeUrl = function( url ) {
        if ( typeof url === 'string' ) {
            jsx.compileUrl( url, orderCallbacks(scriptOrderArray, function(err, code) {
                if ( err ) {
                    throw err;
                } else {
                    newScriptCode( code, url );
                }
            }) );
        } else if ( url instanceof Array ) {
            for ( var i = 0; i < url.length; i++ ) {
                jsx.executeUrl( url[i], callback );
            }
        } else {
            throw new Error( 'unknown value given for url, ' + url );
        }
    }



    jsx.executeCode = function( code ) {
        setTimeout( orderCallbacks(scriptOrderArray, function() {
            newScriptCode( code, url );
        }), 0);
    }

    jsx.compileUrl = function( url, callback ) {
        try {
            var ajaxObj = new window.XMLHttpRequest();

            ajaxObj.onreadystatechange = function() {
                if ( ajaxObj.readyState === 4 ) {
                    var err    = undefined,
                        status = ajaxObj.status;

                    if ( ! (status >= 200 && status < 300 || status === 304) ) {                    
                        err = new Error( "error connecting to url " + url.escapeHTML() + ', ' + status );
                        callback( err, null, url, ajaxObj );
                    } else {
                        var code = jsx.compile( ajaxObj.responseText );
                        callback( null, code, url, ajaxObj );
                    }
                }
            }

            ajaxObj.open( 'GET', url, true );
            ajaxObj.send();
        } catch ( ex ) {
            /*
             * If access using XMLHttpRequest failed, try the ActiveX file
             * system instead (for .hta files or JScript).
             */
            if ( ex.message.toLowerCase().indexOf("access is denied.") === 0 ) {
                if ( "ActiveXObject" in window ) {
                    try {
                        var fileSystem = new ActiveXObject("Scripting.FileSystemObject");
                        var path;

                        if ( url.search(/^(\/|\\|file:\/\/|http:\/\/|https:\/\/)/) === 0 ) {
                            path = url.replace(/^(file:\/\/|http:\/\/|https:\/\/)/, '');
                        } else {
                            path = document.URL.
                                    replace(/^(file:\/\/|http:\/\/|https:\/\/)/, '').
                                    replace(/\\/g, "/").
                                    split("/").
                                    drop(-1).
                                    join( "/" ) + "/" + url;
                        }

                        var file = fileSystem.OpenTextFile( path, 1, false );
                        if ( file ) {
                            var code = jsx.compile( file.readAll() );
                            file.Close();

                            // this *must* be done in the future
                            setTimeout( function() {
                                callback( null, code, url, null );
                            }, 0 );

                            return;
                        }
                    } catch ( ex ) {
                        // do nothing
                    }
                }
            }

            callback(ex, null, url, null);
        }
    };

    var isJSXScriptType = function( type ) {
        if (
                type !== null && 
                type !== undefined && 
                type !== '' && 
                type !== 'javascript' 
        ) {
            type = type.toLowerCase();

            return (
                    type === 'jsx' ||
                    type === 'text/jsx' ||
                    type === 'text\\jsx' ||
                    type === 'application/jsx' ||
                    type === 'application\\jsx'
            );
        } else {
            return false;
        }
    }

    var orderCallbacks = function( arr, callback ) {
        var i = arr.length;
        arr.push({ callback: callback, args: undefined, self: undefined });

        return function() {
            if ( arr[0].callback === callback ) {
                arr.shift().callback.apply( this, arguments );

                while ( arr.length > 0 && arr[0].args !== undefined ) {
                    var obj = arr.shift();

                    obj.callback.apply( obj.self, obj.args );
                }
            } else {
                var obj = arr[i];

                obj.args = arguments;
                obj.self = this;
            }
        }
    }

    var script = document.currentScript;
    if ( ! script ) {
        var scripts = document.getElementsByTagName( 'script' );
        script = scripts[ scripts.length - 1 ];
    }

    if ( script && script.getAttribute('data-autocompile') === 'true' ) {
        jsx.executeScripts();
    }
})();

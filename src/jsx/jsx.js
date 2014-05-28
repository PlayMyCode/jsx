"use strict";

/**
 * jsx.js (javascriptX)
 *
 * Markdown mixed with JavaScript, like literte coffeescript.
 */
(function() {
    var jsx = function( code ) {
        return jsx.parse( code );
    }

    jsx.parseScripts = function() {
        setTimeout( function() {
            var scripts = document.getElementsByTagName( 'script' );
            for ( var i = 0; i < scripts.length; i++ ) {
                var src = scripts[i].getAttribute( 'src' );

                if ( src && src.matches(/.*\.jsx(\?.*)?/) ) {
                    jsx.parseUrl( scripts.src, function(err, code) {
                        if ( err ) {
                            throw err;
                        } else {
                            var script = document.createElement('script');
                            script.innerHTML = code;
                            document.head.appendChild( script );
                        }
                    } );
                }
            }
        }, 0 );
    }

    jsx.parseUrl = function( url, callback ) {
        try {
            var ajaxObj = new window.XMLHttpRequest();

            ajaxObj.onreadystatechange = function() {
                if ( ajaxObj.readyState === 4 ) {
                    var err    = undefined,
                        status = ajaxObj.status;

                    if ( ! (status >= 200 && status < 300 || status === 304) ) {                    
                        err = new Error(
                                "error connecting to url " +
                                slate.util.htmlSafe(url) + ', ' + status
                        );
                        callback( err, null, url, ajaxObj );
                    } else {
                        var code = jsx.parse( ajaxObj.responseText );
                        callback( null, url, ajaxObj );
                    }
                }
            }

            ajaxObj.open( type, url, true );
            ajaxObj.send( '' );
        } catch ( ex ) {
            callback(ex, undefined);
        }
    };

    var isListTest = function( line ) {
        return (
                        (
                                line.charAt(0) === ' ' &&
                                line.charAt(1) === '-' &&
                                line.charAt(2) !== '-'
                        ) || (
                                line.charAt(0) === '-' &&
                                line.charAt(1) !== '-' &&
                                line.length > 2
                        )
                ) || (
                        (
                                line.charAt(0) === ' ' &&
                                line.charAt(1) === '*' &&
                                line.charAt(2) !== '*'
                        ) || (
                                line.charAt(0) === '*' &&
                                line.charAt(1) !== '*' &&
                                line.length > 2
                        )
                );
    }

    var parseinjectedvariables = function( injectedvariables ) {
        var str = '';

        for ( var k in injectedvariables ) {
            if ( injectedvariables.hasownproperty(k) ) {
                str += 
                        "window['" +
                                k.replace(/'/g, "\\'").replace(/\\/g, "\\\\") +
                        "'] = " + 
                        injectedvariables[k] +
                        ";";
            }
        }

        return str;
    }

    jsx.parse = function( code, injectedVariables ) {
        var injectedCode = '';
        if ( injectedVariables ) {
            injectedCode = parseInjectedVariables( injectedVariables );
        }

        var lines = code.split(/\n\r|\r\n|\n|\r/);

        var isMarkdown      = true,
            commentStarted  = false,
            isExample       = false,
            seenExample     = false,
            isList          = false;

        var code = [ '"use strict";(function() {' + injectedCode ];

        var isDoubleComment = false;
        var inDoubleString = false;
        var inSingleString = false;

        for ( var i = 0; i < lines.length; i++ ) {
            var line = lines[i];

            /*
             * Work out what to build.
             */

            if ( isMarkdown ) {
                if (
                        seenExample &&
                        line.length < 4
                ) {
                    isExample   = false;
                    seenExample = false;
                } else if (
                    line.length === 3 &&
                    line.charAt(0) === '`' &&
                    line.charAt(1) === '`' &&
                    line.charAt(2) === '`'
                ) {
                    isExample = true;
                    seenExample = false;
                } else if (
                    line.length >= 8 &&
                    line.charAt(0) === '@' &&
                    line.charAt(1) === 'e' &&
                    line.charAt(2) === 'x' &&
                    line.charAt(3) === 'a' &&
                    line.charAt(4) === 'm' &&
                    line.charAt(5) === 'p' &&
                    line.charAt(6) === 'l' &&
                    line.charAt(7) === 'e'
                ) {
                    isExample = true;
                    seenExample = false;
                } else if ( isExample && !seenExample && line.trim() !== '' ) {
                    seenExample = true;

                } else if (
                        line.length > 4 &&
                        line.charAt(0) === ' ' &&
                        line.charAt(1) === ' ' &&
                        line.charAt(2) === ' ' &&
                        line.charAt(3) === ' '
                ) {
                    if ( isList && line.trim() !== '' ) {
                        // ignore, if this is a continuation of a list
                    } else if ( ! isExample ) {
                        isMarkdown = false;
                    }
                } else if ( isList ) {
                    if ( line.trim() === '' ) {
                        isList = false;
                    } else if ( ! isListTest(line) ) {
                        isList = false;
                    }
                } else if ( isListTest(line) ) {
                    isList = true;
                }
            } else {
                if (
                            line.trim().length > 0 &&
                            (
                                line.charAt(0) !== ' ' ||
                                line.charAt(1) !== ' ' ||
                                line.charAt(2) !== ' ' ||
                                line.charAt(3) !== ' '
                            )
                ) {
                    isMarkdown = true;
                }
            }

            /*
             * Now actually build the new line.
             */
            
            if ( isMarkdown ) {
                var codeLine;

                if ( ! commentStarted ) {
                    codeLine = " /* ";
                    commentStarted = true;
                } else {
                    codeLine = '';
                }

                code.push( codeLine + line.replace( /\*\//g, "* /" ) )
            } else {
                // end the 'previous' line
                if ( commentStarted ) {
                    code[i-1] += " */";
                    commentStarted = false;
                }

                for ( ; i < lines.length; i++ ) {
                    var l = lines[i];

                    /*
                     * we chomp till we reach markdown,
                     * so when we reach it, back up (with i--),
                     * and deal with the markdown on the next outer loop.
                     */
                    // if the line has content, and does not start with 4 spaces ...
                    if ( 
                            l.trim().length > 0 &&
                            (
                                l.charAt(0) !== ' ' ||
                                l.charAt(1) !== ' ' ||
                                l.charAt(2) !== ' ' ||
                                l.charAt(3) !== ' '
                            )
                    ) {
                        isMarkdown = true;
                        i--;
                        break;
                    }

                    var lLen = l.length;
                    for ( var k = 0; k < l.length; k++ ) {
                        var c = l.charAt(k);

                        // these are in order of precedence
                        if ( inDoubleString ) {
                            if (
                                                c === '"' &&
                                    l.charAt(k-1) !== '\\'
                            ) {
                                inDoubleString = false;
                            // support for multiline string
                            } else if ( k === lLen-1 ) {
                                l = l + '\\n" + ';

                                // preserve the initial indentation across the following lines
                                // we only preserve if we can ...
                                lines[i+1] = (lines[i+1] || '').replace( /^    ( *)/, replaceIndentationWithOpenDoubleQuote );

                                // close because we closed it manually on this line,
                                // and it then opens again on the next line
                                inDoubleString = false;
                            }
                        } else if ( inSingleString ) {
                            if (
                                                c === "'" &&
                                    l.charAt(k-1) !== '\\'
                            ) {
                                inSingleString = false;
                            // support for multiline string
                            } else if ( k === lLen-1 ) {
                                l = l + '\\n" + ';

                                // preserve the initial indentation across the following lines
                                // we only preserve if we can ...
                                lines[i+1] = (lines[i+1] || '').replace( /^    ( *)/, replaceIndentationWithOpenSingleQuote );

                                // close because we closed it manually on this line,
                                // and it then opens again on the next line
                                inDoubleString = false;
                            }
                        } else if ( isDoubleComment ) {
                            if (
                                                c === '*' &&
                                    l.charAt(k+1) === '/'
                            ) {
                                isDoubleComment = false;

                                // +1 so we include this character too

                                k++;
                            }
                        } else {
                            /*
                             * Look to enter a new type of block,
                             * such as comments, strings, inlined-JS code.
                             */

                            // multi-line comment
                            if (
                                    c === '/' &&
                                    l.charAt(k+1) === '*'
                            ) {
                                k++;

                                isDoubleComment = true;
                            } else if (
                                    c === '/' &&
                                    l.charAt(k+1) === '/'
                            ) {
                                /* skip the rest of the line for parsing */
                                break;

                                // look for strings
                            } else if ( c === '"' ) {
                                inDoubleString = true;
                            } else if ( c === "'" ) {
                                inSingleString = true;
                            } else if ( c === '/' ) {
                                // todo
                                // replace with '#' for ecmascript 6
                               
                            // change '!=' to '!=='
                            } else if (
                                                c === '!' &&
                                    l.charAt(k+1) === '='
                            ) {
                                if ( l.charAt(k+2) !== '=' ) {
                                    l = l.substring( 0, k ) + '!==' + l.substring( k+2 );
                                }

                                // skip past the '!=='
                                k += 3 - 1;

                            // change '==' to '==='
                            } else if (
                                                c === '=' &&
                                    l.charAt(k+1) === '='
                            ) {
                                if ( l.charAt(k+2) !== '=' ) {
                                    l = l.substring( 0, k ) + '===' + l.substring( k+2 );
                                }

                                // skip past the '==='
                                k += 3 - 1;

                            // change '<-' to 'return'
                            } else if (
                                                c === '<' &&
                                    l.charAt(k+1) === '-' &&
                                    l.charAt(k+2) === ' ' &&
                                    l.charAt(k-1) !== '<'
                            ) {
                                l = l.substring( 0, k ) + 'return' + l.substring( k+2 );
                                k += 6 - 1; // length of 'return' - 1
 
                            // ?? -> arguments[arguments.i = ++arguments.i || 0]
                            } else if (
                                                c === '?' &&
                                    l.charAt(k+1) === '?' &&
                                    l.charAt(k-1) !== '?' &&
                                    l.charAt(k+2) !== '?'
                            ) {
                                var newString = '(arguments[arguments.i = ++arguments.i||0])';
                                l = l.substring( 0, k ) + newString + l.substring( k+2 );
                                k += newString.length;
                            }
                        }
                    } // for c in line

                    code.push( l );
                }
            }
        }

        code.push( '})();' );
        code.push( '' );

        return code.join( "\n" );
    }

    if ( typeof window !== 'undefined' ) {
        window.jsx = jsx;
    } else if ( typeof global !== 'undefined' ) {
        global.jsx = jsx;
    } else {
        throw new Error( "no idea where to put jsx into the global state" );
    }
})();
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

    var parseInjectedVariables = function( injectedVariables ) {
        var str = '';

        for ( var k in injectedVariables ) {
            if ( injectedVariables.hasOwnProperty(k) ) {
                str += 
                        "window['" +
                                k.replace(/'/g, "\\'").replace(/\\/g, "\\\\") +
                        "'] = " + 
                        injectedVariables[k] +
                        ";";
            }
        }

        return str;
    }

    var replaceIndentationWithOpenDoubleQuote = function(match) {
        var strLen = match.length;

        if ( strLen === 4 ) {
            return '    "';
        } else if ( strLen > 4 ) {
            // concat on all indentation spaces, but remove 1, which is replaced with a quote
            // i.e. '     ' -> '    "'
            var newStr = '';
            for ( ; strLen > 2; strLen-- ) {
                newStr += ' ';
            }

            return newStr + '"';
        } else {
            return match;
        }
    };

    var replaceIndentationWithOpenSingleQuote = function(match) {
        var strLen = match.length;

        if ( strLen === 4 ) {
            return "    '";
        } else if ( strLen > 4 ) {
            // concat on all indentation spaces, but remove 1, which is replaced with a quote
            // i.e. '     ' -> '    "'
            var newStr = '';
            for ( ; strLen > 2; strLen-- ) {
                newStr += ' ';
            }

            return newStr + "'";
        } else {
            return match;
        }
    };

    jsx.parse = function( code, injectedVariables ) {
        var injectedCode = '';
        if ( injectedVariables ) {
            injectedCode = parseInjectedVariables( injectedVariables );
        }

        var lines = code.split(/\n\r|\r\n|\n|\r/);

        // Flags to tell which mode we are currently in.
        // By 'mode' I mean are we a string? a list? a comment? markdown comment?.
        var isMarkdown      = false,
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

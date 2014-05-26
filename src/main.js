"use strict";

/**
 * JSX Compiler
 *
 * This will run the jsx file, turning JavaScript + extensions into just 
 * JavaScript.
 */

(function() {



    /*
     * SETUP
     */

    var COMMAND_LINE_OPTIONS = require( './command-line-options.js' );
    var JSX     = require( './jsx.js' ).jsx;
    var PATH    = require( 'path' );
    var FS      = require( 'fs' );
    var Logger  = require( './logger.js' ).Logger;

    var VERSION_NUMBER = "0.2";
    var VERSION_NAME   = "first time it's a proper compiler"

    var VERSION_MESSAGE = "JSX Compiler, v. " + VERSION_NUMBER + "\n" + VERSION_NAME ;
    var HELP_MESSAGE =
            "JSX Compiler\n" +
            "by Joseph Lenton\n" +
            "  \n" +
            "This is essentially JavaScript, with some extra language features.\n" +
            "JSX source files to be compiled by this, are expected to be using the extension\n" +
            "'.jsx'.\n" +
            "  \n" +
            "  \n" +
            "  \n" +
            "  Options\n" +
            "  \n" +
            "    -h --help    Prints this message.\n" +
            "       --verbose Prints out detailed information about the compilation steps.\n" +
            "    -v --version Prints the version number, and something major about it.\n" +
            "  \n" +
            "  \n" +
            "  \n" +
            "    -s --src     One or more source files, seperated by commas, which lists the\n" +
            "                 files to be compiled.\n" +
            "                       jsx -s ./script.jsx\n" +
            "                       jsx -s ./src/*.jsx -o my-project.js\n" +
            "                       jsx -s main.jsx project.jsx logger.jsx -o my-project.js\n" +
            "  \n" +
            "    -o --out     Name of the file to save content to.\n" +
            "                 Not required if you are only compiling one file.\n" +
            "                       jsx -s ./script.jsx -o ./script.js\n" +
            "                       jsx -s ./script.jsx -o script\n" +
            "  \n" +
            "    -f --folder  One or more folders, containing .jsx files to use as source.\n" +
            "                 By default this does *not* include sub-folders, but will if\n" +
            "                 the '-r' recursive flag is used in conjunction with it.\n" +
            "                       jsx -f ./my-project -o ./my-project.js\n" +
            "  \n" +
            "    -r --recurse If a folder is supplied, then this will search them \n" +
            "                 recursively. Otherwise it's not recursive by default.\n" +
            "                       jsx -r -f ./my-project -o ./my-project.js\n" +
            "  \n" +
            "  \n" +
            "    --Xtimestamp Adds the global variable __COMPILE_TIMESTAMP__ which holds\n" +
            "                 the compilers local unix time of when the file was compiled.\n" +
            "                       jsx -s my-script.jsx --Xtimestamp\n" +
            "  \n" +
            "    --Xversion   Adds the global variable __VERSION__ to the code, which holds\n" +
            "                 the value given as a string.\n" +
            "                       jsx -s my-script.jsx --Xversion 3.92\n" +
            "  \n" +
            "  \n" +
            "  \n" ;

    var OPTIONS_SETUP = {
            help: {
                    short       : 'h',
                    takesValue  : false
            },

            version: {
                    short       : 'v',
                    takesValue  : false
            },

            verbose: {
                    takesValue  : false
            },

            out: {
                    short       : 'o',
                    takesValue  : true
            },

            src: {
                    short       : 's',
                    takesValue  : true,
                    multipleValues: true
            },

            folder: {
                    short       : 'f',
                    takesValue  : true,
                    multipleValues: true
            },

            recurse: {
                    short       : 'r',
                    takesValue  : false
            },

            Xtimestamp: {
                    takesValue  : false
            },

            Xversion: {
                    takesValue  : true
            }
    };


    
    /**
     * These are to test if a file name has the .js
     * or .jsx file extension. That's it.
     */

    var IS_JS_REGEX  = /^.+\.js$/i ,
        IS_JSX_REGEX = /^.+\.jsx$/i;



    /*
     * FUNCTIONS
     */

    /**
     * Searches for files to use from the folder option.
     */
    var findFolderFiles = function( seenFiles, src, dest, recursive, log ) {
        log.debug();
        log.debug( 'searching ... ' + src );
        var files = FS.readdirSync( src );

        for ( var j = 0; j < files.length; j++ ) {
            var f     = src + '/' + files[j];
            var stats = FS.lstatSync( f );

            if ( f.charAt(0) !== '.' ) {

                // collect up all jsx and js files
                if ( stats.isFile() ) {
                    if (
                            IS_JS_REGEX.test(f) ||
                            IS_JSX_REGEX.test(f)
                    ) {
                        // only store files we have not yet seen
                        var fPath = PATH.resolve( f );

                        if ( ! seenFiles.hasOwnProperty(fPath) ) {
                            log.debug( '    found ' + fPath );

                            seenFiles[ fPath ] = true;
                            dest.push( fPath );
                        }
                    }

                // or search for more files in a subfolder
                } else if ( recursive && stats.isDirectory() ) {
                    findFolderFiles( seenFiles, f, dest, recursive, log );

                }
            }
        }
    }



    /*
     * CHECK OPTIONS,
     * HANDLE ERRORS,
     * GATHER UP FILES
     */

    console.log();

    var options = COMMAND_LINE_OPTIONS.parse( OPTIONS_SETUP, process.argv );
    var params = options.params;
    var hasError = false;
    var log = new Logger();

    if ( params.verbose ) {
        log.enableMode('debug');
        log.debug( 'verbose logging is on!' );
        log.debug();
    }

    if ( params.help ) { 
        console.log( HELP_MESSAGE );
    } else if ( params.version ) {
        console.log( VERSION_MESSAGE );
    }

    

    // check errors from the options given
    if ( options.errors.length > 0 ) {
        for ( var i = 0; i < options.errors.length; i++ ) {
            log.error( options.errors[i] );
        }

        console.log();
        return;
    }

    var src     = params.src || [];
    var folders = params.folder;
    var out     = params.out;
    var seenFiles = {};

    // -s / --src validation
    if ( src !== undefined ) { 
        log.debug( '--src validation' );

        for ( var i = 0; i < src.length; i++ ) {
            var file = src[i];

            if ( ! FS.existsSync( file ) ) {
                log.error( "cannot find file " + file );
                hasError = true;

            } else {
                var stats = FS.lstatSync( file );

                if ( stats.isDirectory() ) {
                    log.error( "directory given as file " + file );
                    hasError = true;

                } else if ( ! stats.isFile() ) {
                    log.error( "file given is not a file " + file );
                    hasError = true;

                } else {
                    var realPath = PATH.resolve( file );

                    if ( ! seenFiles.hasOwnProperty(realPath) ) {
                        seenFiles[ realPath ] = true;
                        src[i] = realPath;
                    } else {
                        src.splice( i, 1 );
                        i--;
                    }
                }
            }
        }

        log.debug( '--src END' );
        log.debug();
    }



    // -f / --folder validation
    var folderFiles = [];
    if ( folders !== undefined ) {
        log.debug( '--folder validation' );

        for ( var i = 0; i < folders.length; i++ ) {
            var folder = folders[i];

            if ( ! FS.existsSync(folder) ) {
                log.error( "cannot find folder " + folder );
                hasError = true;

            } else {
                var stats = FS.lstatSync( folder );

                if ( stats.isFile() ) {
                    log.error( "folder given is a file " + folder );
                    hasError = true;

                } else if ( ! stats.isDirectory() ) {
                    log.error( "folder given is not a folder " + folder );
                    hasError = true;

                // success! grab all files from the folder
                } else {
                    findFolderFiles( seenFiles, folders[i], folderFiles, !! params.recurse, log );
                }
            }
        }

        log.debug();
        log.debug( '--folder END' );
        log.debug();
    }

    if ( hasError ) {
        console.log();
        return;
    }

    

    // group src + folder together into one collection of files
    
    var srcFirst = false;
    for ( var k in params ) {
        if ( k === 'src' ) {
            srcFirst = true;
            break;
        } else if ( k === 'folder' ) {
            break;
        }
    }

    var allFiles = srcFirst ?
            allFiles = src.concat( folderFiles ) :
            allFiles = folderFiles.concat( src ) ;

    if ( allFiles.length === 0 ) {
        log.error( "no .jsx files found to compile" );
        hasError = true;
    }



    // -o / --out property validation
    
    if ( ! out ) {
        if ( ! folder && src && src.length >= 1 ) {
            out = src[0].replace(/\.jsx$/i, '') + '.js';
            log.debug( "--out no output file named, using src file" );
            log.debug( "--out using file " + out );
        } else {
            log.error( "no file given for where to save output, see the --out command" );
            hasError = true;
        }
    }

    if ( out ) {
        log.debug( '--out validation' );
        log.debug( 'using,', out );

        if ( ! IS_JS_REGEX.test(out) ) {
            log.debug( 'out file is not a JS file, adding ".js" to the end' );
            out += '.js';
        }

        var outPath = PATH.resolve( out );
        if ( seenFiles.hasOwnProperty(outPath) ) {
            log.error( "src file is also being used as destination for outputting code " + out );
            hasError = true;
        }

        log.debug( '--out END' );
        log.debug();
    }



    // the X-Options.
    
    var injects = {};
    if ( params.Xtimestamp ) {
        var time = Date.now();
        injects['__COMPILE_TIMESTAMP__'] = time;
        log.debug( '--Xtimestamp is on, time is ' + time );
    }

    if ( params.Xversion ) {
        injects['__VERSION__'] = params.Xversion;
        log.debug( '--Xversion is on, version is ' + params.Xversion );
    }


    // One final has error check. Always leave this here in case we failed to
    // quit at some point above, when there is an error to quit on.
    if ( hasError ) {
        console.log();
        return;
    }



    /**
     * COMPILE FILES,
     * CONCATE FILES,
     * SAVE
     */

    /**
     * This file takes a folder of scripts, concats them together,
     * and then outputs the result to a destination script.
     *
     * The key thing is that it works on both .jsx and .js files.
     */

    if ( params.verbose ) {
        log.debug( "compiling ..." );

        for ( var i = 0; i < allFiles.length; i++ ) {
            log.debug( "\t" + allFiles[i] );
        }

        log.debug();
    }



    var code = '';
    for ( var i = 0; i < allFiles.length; i++ ) {
        var file = allFiles[i];

        log.debug( ":", file );

        if ( IS_JS_REGEX.test(file) ) {
            log.debug( "\t", "concat as JS file" );
            code += FS.readFileSync( file, 'utf8' );

        } else if ( IS_JSX_REGEX.test(file) ) {
            log.debug( "\t", "compile as JSX file" );
            code += JSX.parse(
                    FS.readFileSync( file, 'utf8' )
            );

        }
    }



    // finally, write it all to disk
    log.debug();
    log.debug( 'write to output,', out );
    FS.writeFileSync( out, code );
    log.debug( 'WE ARE FINISHED!' );
    log.debug();
})()


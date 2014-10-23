
# 
# Setup
#
# This builds both the JSX Client and the JSX Library.
#
# Use 'make help' for help.
# 

# where are the sources
JSX_BAT_SRC=.\src\jsx.bat
JSX_SRC=.\src\jsx\jsx.js
LIB_SRC=.\src\lib\*.js
CLIENT_SRC=.\src\client\main.js .\src\client\logger.js .\src\client\command-line-options.js

# setup specific on how to build and delete jsx stuff
COMPILER=node ./bin/jsx-client.js 
DEL=del /Q 

# 
# Make Dependencies
#

.PHONY: clean install

help:
	@echo "JSX make file"
	@echo "-------------"
	@echo ""
	@echo "JSX client = the standalone version of JSX you can use on the"
	@echo "    command line."
	@echo ""
	@echo "JSX library = the library you can use inside another project for"
	@echo "    compiling JSX code."
	@echo ""
	@echo "Commands"
	@echo ""
	@echo "    make build 			builds both the JSX client and library"
	@echo "    make build-client		builds both the JSX client and library"
	@echo "    make build-library 	builds both the JSX client and library"
	@echo ""
	@echo "    make clean			deletes the built versions of JSX"
	@echo "    make clean-client		deletes just the built JSX client"
	@echo "    make clean-library	deletes the build JSX library only"
	@echo ""
	@echo "    make help 			prints this help info"

all: build

#build: build-client build-lib
build: build-client
build-library: dist/jsx.js
build-client: dist/jsx-client.js dist/jsx.bat

clean: clean-client clean-library

clean-client:
	${DEL} .\dist\jsx-client.js >nul 2>&1
	${DEL} .\dist\jsx.js        >nul 2>&1
	${DEL} .\dist\jsx.bat       >nul 2>&1

clean-library:
	${DEL} .\dist\jsx-library.js >nul 2>&1

install:
	copy /B .\dist\jsx-client.js .\bin\jsx-client.js

# specific file builds

dist/jsx.js: ${JSX_SRC} ${LIB_SRC}
	${COMPILER} --src ${JSX_SRC} ${LIB_SRC}    -o dist/jsx.js

dist/jsx-client.js: ${JSX_SRC} ${JSX_CLIENT}
	${COMPILER} --src ${JSX_SRC} ${CLIENT_SRC} -o dist/jsx-client.js

# copies the bat file for running jsx using binary so it's copied without 
# being read (which can happen with ASCII if the file is actually UNICODE)
dist/jsx.bat: ${JSX_BAT_SRC}
	copy /B ${JSX_BAT_SRC} .\dist\jsx.bat



# 
# Setup
#
# This builds both the JSX Client and the JSX Library.
#
# Use 'make help' for help.
# 

# installation info
INSTALL_DIR=$(USERPROFILE)\.scripts\jsx
INSTALL_RUN_BAT=$(USERPROFILE)\.scripts\jsx.bat

# where are the sources
JSX_BAT_SRC=.\src\jsx.bat
JSX_SRC=.\src\jsx\jsx.js
LIB_SRC=.\src\lib\*.js
CLIENT_SRC=.\src\client\main.js .\src\client\logger.js .\src\client\command-line-options.js

# setup specific on how to build and delete jsx stuff
COMPILER=node ./bin/jsx-client.js 
RM=del /Q 
RMDIR=rmdir /S /Q 

# 
# Make Dependencies
#

.PHONY: clean install

# 
# 		Help
#
# Note the use of dots at the start is to force echo to echo. If the echo 
# content is blank then it prints "ECHO is OFF" instead of nothing.
#

help:
	@echo .
	@echo .   JSX make file
	@echo .   -------------
	@echo .
	@echo .   JSX client = the standalone version of JSX you can use on the
	@echo .       command line.
	@echo .   
	@echo .   JSX library = the library you can use inside another project for
	@echo .       compiling JSX code.
	@echo .   
	@echo .   Commands
	@echo .   
	@echo .       make build            builds both the JSX client and library
	@echo .       make build-client     builds both the JSX client and library
	@echo .       make build-library    builds both the JSX client and library
	@echo .   
	@echo .       make clean            deletes the built versions of JSX
	@echo .       make clean-client     deletes just the built JSX client
	@echo .       make clean-library    deletes the build JSX library only
	@echo .   
	@echo .       make help             prints this help info
	@echo .
	@echo .
	@echo .

all: clean build install

test:
	@echo $(INSTALL_DIR)


build: build-client
build-library: dist/jsx.js
build-client: dist/jsx-client.js dist/jsx.bat



# 
# 		Clean Project
#

clean: clean-client clean-library

clean-client:
	${RM} .\dist\jsx-client.js                                      >nul 2>&1
	${RM} .\dist\jsx.js                                             >nul 2>&1
	${RM} .\dist\jsx.bat                                            >nul 2>&1

clean-library:
	${RM} .\dist\jsx-library.js                                     >nul 2>&1



# 
# 		Install
#

install: install-client

install-client: build-client uninstall-client
	if not exist $(INSTALL_DIR) mkdir $(INSTALL_DIR)
	copy /B .\dist\jsx-client.js $(INSTALL_DIR)
	copy /B .\dist\jsx.bat $(INSTALL_DIR)
	echo %%~dp0\jsx\jsx.bat %%* > $(INSTALL_RUN_BAT)



# 
# 		Uninstall
#

uninstall: uninstall-client

uninstall-client:
	if exist $(INSTALL_RUN_BAT) $(RM) $(INSTALL_RUN_BAT)
	if exist $(INSTALL_DIR) $(RMDIR) $(INSTALL_DIR)



# 
# 		Building Specific Files
#

# specific file builds

dist/jsx.js: ${JSX_SRC} ${LIB_SRC}
	${COMPILER} --src ${JSX_SRC} ${LIB_SRC}    -o dist/jsx.js

dist/jsx-client.js: ${JSX_SRC} ${JSX_CLIENT}
	${COMPILER} --src ${JSX_SRC} ${CLIENT_SRC} -o dist/jsx-client.js

# copies the bat file for running jsx using binary so it's copied without 
# being read (which can happen with ASCII if the file is actually UNICODE)
dist/jsx.bat: ${JSX_BAT_SRC}
	copy /B ${JSX_BAT_SRC} .\dist\jsx.bat



# 
# Setup
# 

# where are the sources
JSX_SRC=src/jsx/jsx.js
LIB_SRC=src/lib/*.js
CLIENT_SRC=src/client/main.js src/client/logger.js src/client/command-line-options.js

# setup specific on how to build and delete jsx stuff
COMPILER=node ./bin/jsx-client.js 
DEL=del /Q 

# 
# Make Dependencies
#

.PHONY: clean install

all: build

#build: build-client build-lib
build: build-client
build-lib: dist/jsx.js
build-client: dist/jsx-client.js

clean: 
	${DEL} .\dist\jsx-client.js >nul 2>&1
	${DEL} .\dist\jsx.js        >nul 2>&1

install:
	copy /B .\dist\jsx-client.js .\bin\jsx-client.js

# specific file builds

dist/jsx.js: ${JSX_SRC} ${LIB_SRC}
	${COMPILER} --src ${JSX_SRC} ${LIB_SRC}    -o dist/jsx.js

dist/jsx-client.js: ${JSX_SRC} ${JSX_CLIENT}
	${COMPILER} --src ${JSX_SRC} ${CLIENT_SRC} -o dist/jsx-client.js



dist/jsx.js: src/*.js
	node ./src/main.js --folder src -o dist/jsx.js

clean: 
	del /Q .\dist\jsx.js



JSX is some common language extensions for JavaScript. 

## Markdown comments

Markdown can be written in files at the top level. To write code, you indent 4
spaces. This allows documentation to look prettier, and for files to be more
elegantly laid out.

## (function() {

All code that it output is automatically wrapped inside of a self-extracting
function. This is a good idiom which should be used regularly, so incorperating
it into a language as standard makes sense.

## "use static"

Just like the self extracting function before, 'use static' is added to the top
of every file when code is compiled.

## == is gone!

Well, kinda. The double equality operator is silently translated into the 
triple equality operator. This is simply due to the fact that the double 
equality operator is a failing in JS, and triple equals should always be used
instead for added safety.

The same is also true with the != operator, which translates to !==.


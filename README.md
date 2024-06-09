# Handcrank

A JavaScript sandbox virtual machine that runs on ESTree syntax trees
(e.g. esprima, etc).  Takes a pedantic approach by implementing the
abstract operations from the ECMA-262 spec very literally.  Evaluation
is done via generators to support stepping through code for debugging
and to avoid infinite loops.

It provides a safe sandbox environment for evaluating JavaScript code
without allowing any access to the host environment, since all
operations are fully emulated.  Additional objects can be added to the
environment to allow safe evaluation of user-provided scripts in the
browser or on the server.

## TODO

- array spread (done?)
- finish binding
    - array destructuring, destructured property assignments
      (will need to teach assignop to do this)
- finish control_flow lexical for loop that started the rathole

## Features

- [x] Evaluate arithmetic
- [x] Bind variables
    - [x] with const/let
    - [x] with var
    - [x] implicitly (sloppy)
- [x] Standard globals
- [x] Basic primitive types and wrappers
    - [x] Number
        - [ ] Math
    - [x] String
    - [x] Symbol
    - [x] Boolean
    - [ ] BigInt
- [ ] Well-known Object types
    - [x] Object
        - [x] static methods
            - [ ] Object.fromEntries
        - [x] instance methods
    - [x] Function
        - [ ] instance methods
    - [x] Error
        - [x] all subtypes
        - [x] throwable
        - [x] stack traces
    - [x] Array
    - [ ] Iterators
    - [ ] RegExp
    - [ ] Arguments
    - [ ] Map
    - [ ] Set
    - [ ] WeakMap / WeakSet
- [x] Define functions
    - [x] vanilla declarations
    - [x] vanilla expressions
    - [x] arrow functions
    - [x] generators
    - [ ] async
    - [ ] async arrows
- [x] Call functions
- [ ] Template string literals
- [ ] Syntax
    - [x] Object literals
    - [x] Array literals
    - [ ] Destructuring
    - [x] binary operators
    - [x] unary operators
    - [x] ++ and -- operators
    - [ ] Control structures
        - [ ] for
        - [ ] if
        - [ ] while
        - [ ] try
    - [ ] Classes
        - [ ] class fields
        - [ ] private fields

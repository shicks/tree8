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

- Figure out promise scheduling
- RootExecutionContext??? - [9.5 Jobs] expects the stack to be empty...?

- consider exposing bindings a little more, lazy-initialized binding
  for arguments objects, etc
- we should probably make a subtype of PropertyMap that stores array
  indices separately in an array, which would allow delegating a lot
  more to the underlying VM.

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
    - [x] Function
    - [x] Error
        - [x] all subtypes
        - [x] throwable
        - [x] stack traces
    - [x] Array
    - [x] Arguments
    - [x] Iterators
    - [x] RegExp
    - [ ] Date
    - [ ] Map
    - [ ] Set
    - [ ] WeakMap / WeakSet
    - [ ] Reflect
    - [ ] Proxy
- [x] Functions
    - [x] vanilla declarations
    - [x] vanilla expressions
    - [x] arrow functions
    - [x] generators
    - [ ] async
    - [ ] async arrows
    - [x] function calls
    - [x] constructor calls
- [x] Syntax
    - [x] object literals
    - [x] array literals
    - [x] destructuring
    - [x] spread
    - [x] binary operators
    - [x] unary operators
    - [x] ++ and -- operators
    - [x] template literals
    - [x] control structures
        - [x] for
        - [x] if
        - [x] while
        - [x] try
        - [x] switch
        - [x] with
    - [x] classes
        - [x] class fields
        - [x] private fields
        - [x] super
    - [x] use strict
    - [x] optional chaining
    - [ ] meta properties (i.e. `new.target`, `import.meta`)
- [ ] Modules
- [ ] Debugger statement
- [ ] SPI for host integration
- [x] Test-262 integration

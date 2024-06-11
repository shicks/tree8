#!/usr/bin/env npx bun

import { DebugString, VM, run } from './internal/vm';
import { syntax } from './internal/syntax';
import { arithmetic } from './internal/arithmetic';
import * as esprima from 'esprima-next';
import * as readline from 'readline';
import { fundamental } from './internal/fundamental';
import { IsAbrupt, IsThrowCompletion } from './internal/completion_record';
import { arrayObject } from './internal/exotic_array';
import { stringObject } from './internal/exotic_string';
import { errorObject } from './internal/error_object';
import { consoleObject } from './internal/console';
import { iterators } from './internal/iterators';
import { generators } from './internal/generator';
import * as fs from 'node:fs';
import { functions } from './internal/func';
import { controlFlow } from './internal/control_flow';
import { classes } from './internal/class';

export const vm = new VM({
  parseScript(source) { return esprima.parseScript(source, {loc: true, range: true}); },
  parseModule(source) { return esprima.parseModule(source, {loc: true, range: true}); },
});

// TODO - reasonable fallback when missing intrinsics?
//        i.e. %String.prototype% might fall back to an ordinary object?
// TODO - rewrite deps as provides/requires for intrinsics?
//        would this still allow overriding modules?  same id still a thing?
//          - but better still to just not install it in the first place?
//          - maybe deps still allows grouping?

vm.install(fundamental);
vm.install(stringObject);
vm.install(syntax);
vm.install(arithmetic);
vm.install(arrayObject);
vm.install(errorObject);
vm.install(consoleObject);
vm.install(iterators);
vm.install(functions);
vm.install(generators);
vm.install(controlFlow);
vm.install(classes);

// TODO - consider adding REPL directives like .report to dump the
// most recent trace.
let reportStackTraceOnThrow = true;

function runScript(script: string, filename: string, printResult = false) {
  const cr = run(vm.evaluateScript(script, filename));
  if (IsAbrupt(cr)) {
    if (IsThrowCompletion(cr)) {
      console.error(`Uncaught ${DebugString(cr.Value)}`);
      if (reportStackTraceOnThrow && (vm as any).lastThrow) {
        console.error((vm as any).lastThrow);
      }
      return 1;
    } else {
      console.dir(cr);
    }
  } else if (printResult) {
    const s = DebugString(cr, 2);
    console.log(s);
  }
  return 0;
}

if (process.argv.length > 2) {
  // Usage:
  //   main          start a repl
  //   main file.js  run file from disk
  //   main -e '...' run script from command line
  if (process.argv[2] === '-e') {
    process.exit(runScript(process.argv[3], 'input.js'));
  } else {
    const script = String(fs.readFileSync(process.argv[2], 'utf8'));
    process.exit(runScript(script, process.argv[2]));
  }
} else {
  const rl = readline.createInterface({input: process.stdin, output: process.stdout});
  rl.on('history', (_h) => {
    // TODO - store to disk
  });
  let replNum = 0;
  function loop(script: string) {
    if (!script || script === 'exit') return;
    try {
      esprima.parseScript(script);
    } catch (err) {
      if (err.description === 'Unexpected end of input') {
        rl.question('... ', (s) => loop(script + '\n' + s));
        return;
      }
    }
    runScript(script, `REPL${++replNum}`, true);
    rl.question('> ', loop);
  }
  rl.question('> ', loop);
}

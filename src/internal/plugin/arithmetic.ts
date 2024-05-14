import { Plugin, PluginSPI } from '../vm';
import { EMPTY, NOT_APPLICABLE } from '../enums';
import { Val } from '../values';
import { CR, IsAbrupt } from '../completion_record';
import { GetValue } from '../reference_record';
import { PropertyDescriptor } from '../property_descriptor';

export const arithmetic: Plugin = (spi: PluginSPI) => {
  spi.onEvaluation(['BinaryExpression'], ($, n, evaluate) => {
    const leftR = orUndefined(evaluate(n.left));
    if (IsAbrupt(leftR)) return leftR;
    const left = GetValue($, leftR);
    if (IsAbrupt(left)) return left;
    const rightR = orUndefined(evaluate(n.right));
    if (IsAbrupt(rightR)) return rightR;
    const right = GetValue($, rightR);
    if (IsAbrupt(right)) return right;
    
    switch (n.operator) {
      case '+': return add(left, right);
    }
    return NOT_APPLICABLE;
  });

  spi.define('Infinity', [], () => PropertyDescriptor({Value: Infinity}));
};

function orUndefined<T>(v: T|EMPTY): T|undefined {
  return EMPTY.is(v) ? undefined : v;
}

// TODO - do this correctly with objects, etc
function add(left: Val, right: Val): CR<Val>|NOT_APPLICABLE {
  if (typeof left === 'number' && typeof right === 'number') return left + right;
  return NOT_APPLICABLE;
}

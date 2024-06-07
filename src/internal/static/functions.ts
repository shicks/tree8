// TODO - this file should get merged elsewhere?  though maybe rename func to functions?
// and obj to objects?

import { CR } from '../completion_record';
import { EvalGen, VM } from '../vm';
import { Source } from '../tree';
import { IteratorRecord } from '../abstract_iterator';
import { EnvironmentRecord } from '../environment_record';
import { UNUSED } from '../enums';

import * as ESTree from 'estree';

type Node = ESTree.Node;

// 8.4 Function Name Inference

/**
 * 8.4.3 Static Semantics: IsAnonymousFunctionDefinition ( expr )
 *
 * The abstract operation IsAnonymousFunctionDefinition takes argument
 * expr (an AssignmentExpression Parse Node or an Initializer Parse
 * Node) and returns a Boolean. It determines if its argument is a
 * function definition that does not bind a name. It performs the
 * following steps when called:
 *
 * 1. If IsFunctionDefinition (8.2.2) of expr is false, return false.
 * 2. Let hasName be HasName (8.2.1) of expr.
 * 3. If hasName is true, return false.
 * 4. Return true.
 */
export function IsAnonymousFunctionDefinition(expr: Node): boolean {
  switch (expr.type) {
    case 'ArrowFunctionExpression':
      return true;
    case 'ClassExpression':
    case 'FunctionExpression':
      return expr.id == null;
    default:
      return false;
  }
}

/**
 * 8.6.3 Runtime Semantics: IteratorBindingInitialization
 *
 * The syntax-directed operation IteratorBindingInitialization takes
 * arguments iteratorRecord (an Iterator Record) and environment (an
 * Environment Record or undefined) and returns either a normal
 * completion containing unused or an abrupt completion.
 *
 * NOTE: When undefined is passed for environment it indicates that a
 * PutValue operation should be used to assign the initialization
 * value. This is the case for formal parameter lists of non-strict
 * functions. In that case the formal parameter bindings are
 * preinitialized in order to deal with the possibility of multiple
 * parameters with the same name.
 *
 * It is defined piecewise over the following productions:
 *
 * ArrayBindingPattern : [ ]
 * 1. Return unused.
 *
 * ArrayBindingPattern : [ Elision ]
 * 1. Return ? IteratorDestructuringAssignmentEvaluation of Elision
 *    with argument iteratorRecord.
 *
 * ArrayBindingPattern : [ Elisionopt BindingRestElement ]
 * 1. If Elision is present, then
 *     a. Perform ? IteratorDestructuringAssignmentEvaluation of
 *        Elision with argument iteratorRecord.
 * 2. Return ? IteratorBindingInitialization of BindingRestElement
 *    with arguments iteratorRecord and environment.
 *
 * ArrayBindingPattern : [ BindingElementList , Elision ]
 * 1. Perform ? IteratorBindingInitialization of BindingElementList
 *    with arguments iteratorRecord and environment.
 * 2. Return ? IteratorDestructuringAssignmentEvaluation of Elision
 *    with argument iteratorRecord.
 *
 * ArrayBindingPattern : [ BindingElementList , Elisionopt BindingRestElement ]
 * 1. Perform ? IteratorBindingInitialization of BindingElementList
 *    with arguments iteratorRecord and environment.
 * 2. If Elision is present, then
 *     a. Perform ? IteratorDestructuringAssignmentEvaluation of
 *        Elision with argument iteratorRecord.
 * 3. Return ? IteratorBindingInitialization of BindingRestElement
 *    with arguments iteratorRecord and environment.
 *
 * BindingElementList : BindingElementList , BindingElisionElement
 * 1. Perform ? IteratorBindingInitialization of BindingElementList
 *    with arguments iteratorRecord and environment.
 * 2. Return ? IteratorBindingInitialization of BindingElisionElement
 *    with arguments iteratorRecord and environment.
 *
 * BindingElisionElement : Elision BindingElement
 * 1. Perform ? IteratorDestructuringAssignmentEvaluation of Elision
 *    with argument iteratorRecord.
 * 2. Return ? IteratorBindingInitialization of BindingElement with
 *    arguments iteratorRecord and environment.
 *
 * SingleNameBinding : BindingIdentifier Initializeropt
 * 1. Let bindingId be StringValue of BindingIdentifier.
 * 2. Let lhs be ? ResolveBinding(bindingId, environment).
 * 3. Let v be undefined.
 * 4. If iteratorRecord.[[Done]] is false, then
 *     a. Let next be Completion(IteratorStep(iteratorRecord)).
 *     b. If next is an abrupt completion, set iteratorRecord.[[Done]] to true.
 *     c. ReturnIfAbrupt(next).
 *     d. If next is false, set iteratorRecord.[[Done]] to true.
 *     e. Else,
 *         i. Set v to Completion(IteratorValue(next)).
 *         ii. If v is an abrupt completion, set iteratorRecord.[[Done]] to true.
 *         iii. ReturnIfAbrupt(v).
 * 5. If Initializer is present and v is undefined, then
 *     a. If IsAnonymousFunctionDefinition(Initializer) is true, then
 *         i. Set v to ? NamedEvaluation of Initializer with argument bindingId.
 *     b. Else,
 *         i. Let defaultValue be ? Evaluation of Initializer.
 *         ii. Set v to ? GetValue(defaultValue).
 * 6. If environment is undefined, return ? PutValue(lhs, v).
 * 7. Return ? InitializeReferencedBinding(lhs, v).
 *
 * BindingElement : BindingPattern Initializeropt
 * 1. Let v be undefined.
 * 2. If iteratorRecord.[[Done]] is false, then
 *     a. Let next be Completion(IteratorStep(iteratorRecord)).
 *     b. If next is an abrupt completion, set iteratorRecord.[[Done]] to true.
 *     c. ReturnIfAbrupt(next).
 *     d. If next is false, set iteratorRecord.[[Done]] to true.
 *     e. Else,
 *         i. Set v to Completion(IteratorValue(next)).
 *         ii. If v is an abrupt completion, set iteratorRecord.[[Done]] to true.
 *         iii. ReturnIfAbrupt(v).
 * 3. If Initializer is present and v is undefined, then
 *     a. Let defaultValue be ? Evaluation of Initializer.
 *     b. Set v to ? GetValue(defaultValue).
 * 4. Return ? BindingInitialization of BindingPattern with arguments v and environment.
 *
 * BindingRestElement : ... BindingIdentifier
 * 1. Let lhs be ? ResolveBinding(StringValue of BindingIdentifier, environment).
 * 2. Let A be ! ArrayCreate(0).
 * 3. Let n be 0.
 * 4. Repeat,
 *     a. If iteratorRecord.[[Done]] is false, then
 *         i. Let next be Completion(IteratorStep(iteratorRecord)).
 *         ii. If next is an abrupt completion, set iteratorRecord.[[Done]] to true.
 *         iii. ReturnIfAbrupt(next).
 *         iv. If next is false, set iteratorRecord.[[Done]] to true.
 *     b. If iteratorRecord.[[Done]] is true, then
 *         i. If environment is undefined, return ? PutValue(lhs, A).
 *         ii. Return ? InitializeReferencedBinding(lhs, A).
 *     c. Let nextValue be Completion(IteratorValue(next)).
 *     d. If nextValue is an abrupt completion, set iteratorRecord.[[Done]] to true.
 *     e. ReturnIfAbrupt(nextValue).
 *     f. Perform ! CreateDataPropertyOrThrow(A, ! ToString(𝔽(n)), nextValue).
 *     g. Set n to n + 1.
 *
 * BindingRestElement : ... BindingPattern
 * 1. Let A be ! ArrayCreate(0).
 * 2. Let n be 0.
 * 3. Repeat,
 *     a. If iteratorRecord.[[Done]] is false, then
 *         i. Let next be Completion(IteratorStep(iteratorRecord)).
 *         ii. If next is an abrupt completion, set iteratorRecord.[[Done]] to true.
 *         iii. ReturnIfAbrupt(next).
 *         iv. If next is false, set iteratorRecord.[[Done]] to true.
 *     b. If iteratorRecord.[[Done]] is true, then
 *         i. Return ? BindingInitialization of BindingPattern with
 *            arguments A and environment.
 *     c. Let nextValue be Completion(IteratorValue(next)).
 *     d. If nextValue is an abrupt completion, set iteratorRecord.[[Done]] to true.
 *     e. ReturnIfAbrupt(nextValue).
 *     f. Perform ! CreateDataPropertyOrThrow(A, ! ToString(𝔽(n)), nextValue).
 *     g. Set n to n + 1.
 *
 * FormalParameters : [empty]
 * 1. Return unused.
 *
 * FormalParameters : FormalParameterList , FunctionRestParameter
 * 1. Perform ? IteratorBindingInitialization of FormalParameterList
 *    with arguments iteratorRecord and environment.
 * 2. Return ? IteratorBindingInitialization of FunctionRestParameter
 *    with arguments iteratorRecord and environment.
 *
 * FormalParameterList : FormalParameterList , FormalParameter
 * 1. Perform ? IteratorBindingInitialization of FormalParameterList
 *    with arguments iteratorRecord and environment.
 * 2. Return ? IteratorBindingInitialization of FormalParameter with
 *    arguments iteratorRecord and environment.
 *
 * ArrowParameters : BindingIdentifier
 * 1. Let v be undefined.
 * 2. Assert: iteratorRecord.[[Done]] is false.
 * 3. Let next be Completion(IteratorStep(iteratorRecord)).
 * 4. If next is an abrupt completion, set iteratorRecord.[[Done]] to true.
 * 5. ReturnIfAbrupt(next).
 * 6. If next is false, set iteratorRecord.[[Done]] to true.
 * 7. Else,
 *     a. Set v to Completion(IteratorValue(next)).
 *     b. If v is an abrupt completion, set iteratorRecord.[[Done]] to true.
 *     c. ReturnIfAbrupt(v).
 * 8. Return ? BindingInitialization of BindingIdentifier with
 *    arguments v and environment.
 *
 * ArrowParameters : CoverParenthesizedExpressionAndArrowParameterList
 * 1. Let formals be the ArrowFormalParameters that is covered by
 *    CoverParenthesizedExpressionAndArrowParameterList.
 * 2. Return ? IteratorBindingInitialization of formals with arguments
 *    iteratorRecord and environment.
 *
 * AsyncArrowBindingIdentifier : BindingIdentifier
 * 1. Let v be undefined.
 * 2. Assert: iteratorRecord.[[Done]] is false.
 * 3. Let next be Completion(IteratorStep(iteratorRecord)).
 * 4. If next is an abrupt completion, set iteratorRecord.[[Done]] to true.
 * 5. ReturnIfAbrupt(next).
 * 6. If next is false, set iteratorRecord.[[Done]] to true.
 * 7. Else,
 *     a. Set v to Completion(IteratorValue(next)).
 *     b. If v is an abrupt completion, set iteratorRecord.[[Done]] to true.
 *     c. ReturnIfAbrupt(v).
 * 8. Return ? BindingInitialization of BindingIdentifier with
 *    arguments v and environment.
 */
export function* IteratorBindingInitialization(
  $: VM,
  iteratorRecord: IteratorRecord,
  environment: EnvironmentRecord|undefined,
  n: ESTree.Pattern[],
): EvalGen<CR<UNUSED>> {
  if (!n.length) return UNUSED;

  throw 'not implemented';

}

/**
 * 15.1.2 Static Semantics: ContainsExpression
 *
 * The syntax-directed operation ContainsExpression takes no arguments
 * and returns a Boolean. It is defined piecewise over the following
 * productions:
 *
 * ObjectBindingPattern :
 *     { }
 *     { BindingRestProperty }
 * 1. Return false.
 * 
 * ObjectBindingPattern : { BindingPropertyList , BindingRestProperty }
 * 1. Return ContainsExpression of BindingPropertyList.
 * 
 * ArrayBindingPattern : [ Elisionopt ]
 * 1. Return false.
 * 
 * ArrayBindingPattern : [ Elisionopt BindingRestElement ]
 * 1. Return ContainsExpression of BindingRestElement.
 * 
 * ArrayBindingPattern : [ BindingElementList , Elisionopt ]
 * 1. Return ContainsExpression of BindingElementList.
 * 
 * ArrayBindingPattern : [ BindingElementList , Elisionopt BindingRestElement ]
 * 1. Let has be ContainsExpression of BindingElementList.
 * 2. If has is true, return true.
 * 3. Return ContainsExpression of BindingRestElement.
 * 
 * BindingPropertyList : BindingPropertyList , BindingProperty
 * 1. Let has be ContainsExpression of BindingPropertyList.
 * 2. If has is true, return true.
 * 3. Return ContainsExpression of BindingProperty.
 * 
 * BindingElementList : BindingElementList , BindingElisionElement
 * 1. Let has be ContainsExpression of BindingElementList.
 * 2. If has is true, return true.
 * 3. Return ContainsExpression of BindingElisionElement.
 * 
 * BindingElisionElement : Elisionopt BindingElement
 * 1. Return ContainsExpression of BindingElement.
 * 
 * BindingProperty : PropertyName : BindingElement
 * 1. Let has be IsComputedPropertyKey of PropertyName.
 * 2. If has is true, return true.
 * 3. Return ContainsExpression of BindingElement.
 * 
 * BindingElement : BindingPattern Initializer
 * 1. Return true.
 * 
 * SingleNameBinding : BindingIdentifier
 * 1. Return false.
 * 
 * SingleNameBinding : BindingIdentifier Initializer
 * 1. Return true.
 * 
 * BindingRestElement : ... BindingIdentifier
 * 1. Return false.
 * 
 * BindingRestElement : ... BindingPattern
 * 1. Return ContainsExpression of BindingPattern.
 * 
 * FormalParameters : [empty]
 * 1. Return false.
 * 
 * FormalParameters : FormalParameterList , FunctionRestParameter
 * 1. If ContainsExpression of FormalParameterList is true, return true.
 * 2. Return ContainsExpression of FunctionRestParameter.
 * 
 * FormalParameterList : FormalParameterList , FormalParameter
 * 1. If ContainsExpression of FormalParameterList is true, return true.
 * 2. Return ContainsExpression of FormalParameter.
 * 
 * ArrowParameters : BindingIdentifier
 * 1. Return false.
 * 
 * ArrowParameters : CoverParenthesizedExpressionAndArrowParameterList
 * 1. Let formals be the ArrowFormalParameters that is covered by
 *    CoverParenthesizedExpressionAndArrowParameterList.
 * 2. Return ContainsExpression of formals.
 * 
 * AsyncArrowBindingIdentifier : BindingIdentifier
 * 1. Return false.
 */
export function ContainsExpression(n: Node|null): boolean {
  if (!n) return false;
  switch (n.type) {
    case 'ObjectPattern':
      return n.properties.some(ContainsExpression);
    case 'ArrayPattern':
      return n.elements.some(ContainsExpression);
    case 'Property':
      return n.computed || ContainsExpression(n.value);
    case 'AssignmentPattern':
      return true;
    default:
      return false;
  }
}

/**
 * 15.1.3 Static Semantics: IsSimpleParameterList
 *
 * The syntax-directed operation IsSimpleParameterList takes no
 * arguments and returns a Boolean. It is defined piecewise over the
 * following productions:
 *
 * BindingElement : BindingPattern
 * 1. Return false.
 *
 * BindingElement : BindingPattern Initializer
 * 1. Return false.
 *
 * SingleNameBinding : BindingIdentifier
 * 1. Return true.
 *
 * SingleNameBinding : BindingIdentifier Initializer
 * 1. Return false.
 *
 * FormalParameters : [empty]
 * 1. Return true.
 *
 * FormalParameters : FunctionRestParameter
 * 1. Return false.
 *
 * FormalParameters : FormalParameterList , FunctionRestParameter
 * 1. Return false.
 *
 * FormalParameterList : FormalParameterList , FormalParameter
 * 1. If IsSimpleParameterList of FormalParameterList is false, return
 *    false.
 * 2. Return IsSimpleParameterList of FormalParameter.
 *
 * FormalParameter : BindingElement
 * 1. Return IsSimpleParameterList of BindingElement.
 *
 * ArrowParameters : BindingIdentifier
 * 1. Return true.
 *
 * ArrowParameters : CoverParenthesizedExpressionAndArrowParameterList
 * 1. Let formals be the ArrowFormalParameters that is covered by
 *    CoverParenthesizedExpressionAndArrowParameterList.
 * 2. Return IsSimpleParameterList of formals.
 *
 * AsyncArrowBindingIdentifier : BindingIdentifier
 * 1. Return true.
 *
 * CoverCallExpressionAndAsyncArrowHead : MemberExpression Arguments
 * 1. Let head be the AsyncArrowHead that is covered by
 *    CoverCallExpressionAndAsyncArrowHead.
 * 2. Return IsSimpleParameterList of head.
 */
export function IsSimpleParameterList(params: Node[]): boolean {
  for (const n of params) {
    switch (n.type) {
      case 'Identifier':
        break;
      case 'AssignmentExpression':
      case 'RestElement':
      case 'ObjectPattern':
      case 'ArrayPattern':
        return false;
      default:
        throw new Error(`unexpected node type in formals: ${n.type}`);
    }
  }
  return true;
}

// ESTree details
export function GetSourceText(n: Node): string {
  // NOTE: This is not accurate for methods - we'll need to fix that when
  // we implement classes and/or object methods, but rather than using a
  // parent reference, it's probably better to just read the parent directly
  // when we already have it handy.

  // if ((n as ParentNode).parent?.type === 'Property') {
  //   n = (n as ParentNode).parent!;
  // }
  if (!n) return NO_SOURCE;
  if (!n.loc) return NO_SOURCE;
  const start = (n as any).start ?? n.range?.[0];
  const end = (n as any).end ?? n.range?.[1];
  if (start == null || end == null) return NO_SOURCE;
  return (n.loc.source as Source)?.sourceText?.substring(start, end) ??
      NO_SOURCE;
}
const NO_SOURCE = '(no source)';


/**
 * 15.1.5 Static Semantics: ExpectedArgumentCount
 *
 * The syntax-directed operation ExpectedArgumentCount takes no
 * arguments and returns an integer. It is defined piecewise over the
 * following productions:
 *
 * FormalParameters :
 *   [empty]
 *   FunctionRestParameter
 * 1. Return 0.
 *
 * FormalParameters : FormalParameterList , FunctionRestParameter
 * 1. Return ExpectedArgumentCount of FormalParameterList.
 *
 * NOTE: The ExpectedArgumentCount of a FormalParameterList is the
 * number of FormalParameters to the left of either the rest parameter
 * or the first FormalParameter with an Initializer. A FormalParameter
 * without an initializer is allowed after the first parameter with an
 * initializer but such parameters are considered to be optional with
 * undefined as their default value.
 * 
 * FormalParameterList : FormalParameter
 * 1. If HasInitializer of FormalParameter is true, return 0.
 * 2. Return 1.
 *
 * FormalParameterList : FormalParameterList , FormalParameter
 * 1. Let count be ExpectedArgumentCount of FormalParameterList.
 * 2. If HasInitializer of FormalParameterList is true or
 *    HasInitializer of FormalParameter is true, return count.
 * 3. Return count + 1.
 *
 * ArrowParameters : BindingIdentifier
 * 1. Return 1.
 *
 * ArrowParameters : CoverParenthesizedExpressionAndArrowParameterList
 * 1. Let formals be the ArrowFormalParameters that is covered by
 *    CoverParenthesizedExpressionAndArrowParameterList.
 * 2. Return ExpectedArgumentCount of formals.
 *
 * PropertySetParameterList : FormalParameter
 * 1. If HasInitializer of FormalParameter is true, return 0.
 * 2. Return 1.
 *
 * AsyncArrowBindingIdentifier : BindingIdentifier
 * 1. Return 1.
 */
export function ExpectedArgumentCount(params: ESTree.Pattern[]): number {
  let count = 0;
  for (const n of params) {
    if (n.type === 'AssignmentPattern' || n.type === 'RestElement') break;
    count++;
  }
  return count;
}

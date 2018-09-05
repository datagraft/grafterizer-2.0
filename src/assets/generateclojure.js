import * as jsedn from 'jsedn';
import * as transformationDataModel from './transformationdatamodel.js';

/***************************************************************************
 * Main Grafter/Clojure generation variables and functions.
 ****************************************************************************/

var grafterSupportedRDFPrefixes = [{
  name: 'dcat',
  text: ''
},
{
  name: 'dcterms',
  text: ''
},
{
  name: 'foaf',
  text: ''
},
{
  name: 'org',
  text: ''
},
{
  name: 'os',
  text: ''
},
{
  name: 'ps',
  text: ''
},
{
  name: 'owl',
  text: ''
},
{
  name: 'pmd',
  text: ''
},
{
  name: 'qb',
  text: ''
},
{
  name: 'rdf',
  text: ''
},
{
  name: 'sdmx-attribute',
  text: ''
},
{
  name: 'sdmx-measure',
  text: ''
},
{
  name: 'sdmx-concept',
  text: ''
},
{
  name: 'skos',
  text: ''
},
{
  name: 'vcard',
  text: ''
},
{
  name: 'void',
  text: ''
},
{
  name: 'xsd',
  text: ''
}
];

function isSupportedPrefix(prefixName) {
  var i;
  for (i = 0; i < grafterSupportedRDFPrefixes.length; ++i) {
    if (grafterSupportedRDFPrefixes[i].name === prefixName)
      return true;
  }

  return false;
}

var pipelineFunctions = new jsedn.List([]);

var pipeline = new jsedn.List([
  jsedn.sym('defn'),
  jsedn.sym('pipeline'),
  new jsedn.Vector([new jsedn.sym('dataset')]),
  new jsedn.List([jsedn.sym('->'), jsedn.sym('dataset')])
]);

/* Holds the individual declarations. Used to form the declarations object that can then be rendered in Clojure. */
var prefixers = [];

/* Holds the jsedn list of user functions. Used to render them in Clojure code. */
var userFunctions = [];

/* Interface for alerts about errors. To be used to connect to other interface components when we integrate the GUI. */
function alertInterface(error, errorString) {
  /*
   * TODO re-define me when integrating with the rest of the UI
   */
  var message = errorString;
  if (!message && error && error.message) {
    message = message;
  } else {
    message = error;
  }

  /*   Raven.captureMessage(message, {
      tags: {
        file: 'generateclojure',
        method: 'alertInterface'
      }
    }); */
  console.log(error, errorString);
}

/* Adds a prefixer to the list of pre-defined prefixers */
function addGrafterPrefixer(name, prefixString, parentPrefix) {
  var prefixer;

  if (parentPrefix.toString().trim() === '') {
    prefixer = new jsedn.List([
      jsedn.sym('def'),
      jsedn.sym(name.replace(/\./g, '-')),
      new jsedn.List([jsedn.sym('prefixer'), prefixString])
    ]);

  } else {

    prefixer = new jsedn.List([
      jsedn.sym('def'),
      jsedn.sym(name.replace(/\./g, '-')),
      new jsedn.List(
        [jsedn.sym('prefixer'), new jsedn.List([jsedn.sym(parentPrefix), prefixString])])
    ]);
  }

  prefixers.push(prefixer);
}

/* Constructs the collection of defined prefixers for RDF-isation */
function constructGrafterPrefixersArray() {
  // we make a copy of the prefixers array that we eventually return
  var result = prefixers.slice();

  /* the prefixers array needs to be re-initialized so that we don't append new values to it when generating the Grafter code */
  prefixers = [];
  return result;
}

/* Adds a user function rendered as a jsedn object to the collection of user functions */
function addUserFunction(userFunctionEdn) {
  userFunctions.push(userFunctionEdn);
}

/* Calls the jsedn parser and returns the parsed user function */
function parseAndAddUserFunction(userFunctionString) {
  var result = parseEdnFromString(userFunctionString, 'Error parsing user function!');

  if (!result) return false;

  addUserFunction(result);
  return true;
}

function constructUserFunctions() {
  // we make a copy of the user functions array that we eventually return
  var result;

  userFunctions = userFunctions.filter(function (elem) {
    return elem !== undefined;
  });

  if (userFunctions)
    result = userFunctions.slice();

  /* the user functions array needs to be re-initialized so that we don't append new values
   * to it when generating the Grafter code */
  userFunctions = [];

  return result;
}

/* Generic clojure code parser. Outputs a message to the alertInterface function
 * in case an error occurs during parsing.
 */
function parseEdnFromString(toParse, messageOnError) {
  try {
    var ednObject = jsedn.parse(toParse);
    return ednObject;
  } catch (e) {
    alertInterface(e, messageOnError);
    return null;
  }
}

/* Add a pipeline function (either user-defined or provided by Grafter) to an array
 * which is used to construct the data transformation pipeline. */
function addPipelineFunction(jsednFunction) {
  if (typeof jsednFunction.generateClojure === 'function') {
    pipelineFunctions.val.push(jsednFunction.generateClojure());
  }
}

/* Constructs and returns the data transformation pipeline. */
function constructPipeline() {
  //      console.log($rootScope.CSVdelim);
  //     var separator = $rootScope.CSVdelim?$rootScope.CSVdelim:'\\,';
  var readDatasetFunct = new jsedn.List([
    new jsedn.sym('read-dataset'),
    new jsedn.sym('data-file')
  ]);

  pipeline = null;

  pipeline = new jsedn.List([
    jsedn.sym('defpipe'),
    jsedn.sym('my-pipe'),
    'Grafter pipeline for data clean-up and preparation.',
    new jsedn.Vector([new jsedn.sym('data-file')]),
    new jsedn.List([jsedn.sym('->'), readDatasetFunct])
  ]);

  pipelineFunctions.map(function (arg) {
    pipeline.val[4].val.push(arg);
  });

  //(read-dataset data-file :format :csv)
  pipelineFunctions = new jsedn.List([]);
  return pipeline;
}

function parseConditions(condArray) {
  var parsedConditions = [];
  var regexParsed;
  for (var a = 0; a < condArray.length; ++a) {

    var cond = condArray[a];
    var operator, parsedCond;

    switch (cond.operator.id) {
      case 0:

        parsedCond = new jsedn.List([jsedn.sym('not-empty?'), jsedn.sym(typeof cond.column === 'object' ? cond.column.value : cond.column)]);

        break;
      case 1:
        operator = '=';
        break;
      case 2:
        operator = 'not=';
        break;
      case 3:
        operator = '>';
        break;
      case 4:
        operator = '<';
        break;
      case 5:
        regexParsed = '#\"(?i).*' + cond.operand + '.*\"';
        parsedCond = new jsedn.List([jsedn.sym('not'),
        new jsedn.List([jsedn.sym('nil?'),
        new jsedn.List([jsedn.sym('re-find'),
        new jsedn.List([jsedn.sym('read-string'), regexParsed]), jsedn.sym(typeof cond.column === 'object' ? cond.column.value : cond.column)
        ])
        ])
        ]);
        break;
      default:

        var condElems = cond.operand.split(" ");
        for (var j = 0; j < condElems.length; ++j)
          condElems[j] = new jsedn.sym(condElems[j]);
        parsedCond = new jsedn.List(condElems);
        break;


    }

    if (parsedCond !== undefined) {

      parsedConditions.push(parsedCond);
    } else {
      if (isNaN(cond.operand)) {
        parsedConditions.push(new jsedn.List([jsedn.sym(operator), jsedn.sym(typeof cond.column === 'object' ? cond.column.value : cond.column), cond.operand]));
      } else {
        parsedConditions.push(new jsedn.List([jsedn.sym(operator), jsedn.sym(typeof cond.column === 'object' ? cond.column.value : cond.column), Number(cond.operand)]));
      }
    }
  }
  return parsedConditions;

}

function constructConditionalNodeVectorJsEdn(node, currentNodeJsEdn) {
  var modifCurrentNodeJsEdn = currentNodeJsEdn;
  if (node.nodeCondition.length > 0) {
    var parsedConditions = parseConditions(node.nodeCondition);
    if (parsedConditions.length === 1) {
      modifCurrentNodeJsEdn = new jsedn.List([jsedn.sym("if"), parsedConditions[0], currentNodeJsEdn]);
    } else {
      modifCurrentNodeJsEdn = new jsedn.List([jsedn.sym("if"), parsedConditions[0], currentNodeJsEdn]);
    }

  }

  return modifCurrentNodeJsEdn;
}
/* Constructs and returns the RDF creation function. */
export function constructRDFGraphFunction(transformation) {
  //var prefixersInGUI = transformation.prefixers;
  var i;
  var j;
  var currentGraph = null;

  var colKeysClj = new jsedn.Vector([]);
  var columnKeysFromPipeline = transformation.getColumnKeysFromPipeline();

  for (i = 0; i < columnKeysFromPipeline.length; ++i) {
    colKeysClj.val.push(new jsedn.sym(columnKeysFromPipeline[i]));
  }

  var columnKeysFromGraph = transformation.getColumnKeysFromGraphNodes();

  for (i = 0; i < columnKeysFromGraph.length; ++i)
    if (columnKeysFromPipeline.indexOf(columnKeysFromGraph[i]) === -1 && typeof columnKeysFromGraph[i] ===
      'string') {
      colKeysClj.val.push(new jsedn.sym(columnKeysFromGraph[i]));
    }

  var graphFunction = new jsedn.List([
    new jsedn.sym('graph-fn'),
    new jsedn.Vector([
      new jsedn.Map([new jsedn.kw(':keys'), colKeysClj])
    ])
  ]);

  var currentGraphJsEdn = null;
  var currentRootJsEdn = null;
  var currentGraphJsEdn = null;
  // var currentGraphJsEdn = new jsedn.List([jsedn.sym('graph'), 'TODO not used']);
  for (i = 0; i < transformation.graphs.length; ++i) {
    currentGraph = transformation.graphs[i];
    if (i === 0) {
      currentGraphJsEdn = new jsedn.List([jsedn.sym('graph'), currentGraph.graphURI || "http://example.com/"]);
    }
    // construct a vector for each of the roots and add it to the graph jsedn
    for (j = 0; j < currentGraph.graphRoots.length; ++j) {
      currentRootJsEdn = constructNodeVectorEdn(currentGraph.graphRoots[j], currentGraph);
      if (currentRootJsEdn) {
        if (currentRootJsEdn.constructor === Array) {
          for (var k = 0; k < currentRootJsEdn.length; ++k) {
            currentGraphJsEdn.val.push(constructConditionalNodeVectorJsEdn(currentGraph.graphRoots[j], currentRootJsEdn[k]));
          }
        } else {
          currentGraphJsEdn.val.push(constructConditionalNodeVectorJsEdn(currentGraph.graphRoots[j], currentRootJsEdn));
        }
      }
    }
    graphFunction.val.push(currentGraphJsEdn);
  }
  var result = new jsedn.List([jsedn.sym('def'), jsedn.sym('make-graph'), graphFunction]);
  return result;
}

function constructNodeVectorEdn(node, containingGraph) {
  var i;
  var k;
  var allSubElementsVector;
  var nonCondSubElementsVector;
  var subElementEdn;
  if (!node) {
    return;
  }
  node = transformationDataModel.getGraphElement(node);

  if (node instanceof transformationDataModel.Property /*&& (node.propertyCondition === undefined || node.propertyCondition === '')*/) {

    if (node.subElements.length === 0) {
      //        alertInterface('Error found in RDF mapping for the sub-elements node ' + node.propertyName + '!');
      // not a big deal - just not valid provided mapping
      // maybe make it highlighted? (should do that later on)
      return;
    }

    var propertyValue = node.subElements[0];
    var propertyJsEdn = constructPropertyJsEdn(node);
    var nodeVectorJsEdn = constructNodeVectorEdn(propertyValue, containingGraph);
    if (propertyJsEdn && nodeVectorJsEdn) {
      return new jsedn.Vector([propertyJsEdn, nodeVectorJsEdn]);
    } else {
      return;
    }
    // [name {either single node or URI node with sub-nodes (as vector)}

  }

  if (node instanceof transformationDataModel.ColumnLiteral) {
    if (typeof node.literalValue === 'object') {
      if (node.literalValue.value.trim() === '') {
        alertInterface('Empty column literal mapping found!');
      }
    } else if (typeof node.literalValue === 'string') {
      if (node.literalValue.trim() === '') {
        alertInterface('Empty column literal mapping found!');
      }
    }

    // return the value as symbol
    var value;
    if (node.datatype.name === 'unspecified') {
      value = new jsedn.sym(typeof node.literalValue === 'object' ? node.literalValue.value : node.literalValue);
    } else {

      switch (node.datatype.name) {
        case 'string':

          var convertLiteralValues = [jsedn.sym("datatypes/convert-literal"), jsedn.sym(typeof node.literalValue === 'object' ? node.literalValue.value : node.literalValue), "string"];
          if (node.onEmpty) {
            convertLiteralValues.push(jsedn.kw(":on-empty"));
            convertLiteralValues.push(node.onEmpty);
          }
          if (node.langTag) {
            convertLiteralValues.push(jsedn.kw(":lang-tag"));
            convertLiteralValues.push(node.langTag);
          }
          value = new jsedn.List(convertLiteralValues);
          break;
        case 'custom':
          if (node.datatypeURI.trim() === '') {
            alertInterface('Unspecified URI for custom data type!');
          } else {
            value = new jsedn.List([jsedn.sym("s"),
            jsedn.sym(typeof node.literalValue === 'object' ? node.literalValue.value : node.literalValue),
            new jsedn.List([jsedn.sym("org.openrdf.model.impl.URIImpl."), node.datatypeURI])
            ]);
          }
          break;
        default:
          var convertLiteralValues = [jsedn.sym("datatypes/convert-literal"), jsedn.sym(typeof node.literalValue === 'object' ? node.literalValue.value : node.literalValue), node.datatype.name];

          if (node.onEmpty) {
            convertLiteralValues.push(jsedn.kw(":on-empty"));
            convertLiteralValues.push(node.onEmpty);
          }
          if (node.onError) {
            convertLiteralValues.push(jsedn.kw(":on-error"));
            convertLiteralValues.push(node.onError);
          }
          value = new jsedn.List(convertLiteralValues);
          break;

      }
    }

    return value;
  }

  if (node instanceof transformationDataModel.ConstantLiteral) {
    if (node.literalValue.trim() === '') {
      alertInterface('Empty text literal found in RDF mapping!');
    }

    // Check if value is URI, if not -- define it as a string literal

    var isURI = node.literalValue.search(/(http|https):\/\//);

    var values = [];
    if (isURI !== 0) {
      if (Number.isNaN(parseFloat(node.literalValue))) {
        values.push(jsedn.sym('s'));
      } else {
        if (Number.isInteger(parseFloat(node.literalValue))) {
          values.push(jsedn.sym('Integer/parseInt'));
        } else {
          values.push(jsedn.sym('Double/parseDouble'));
        }
      }
    }

    values.push(node.literalValue);

    if (isURI !== 0) {
      return new jsedn.List(values);
    }

    return node.literalValue;

  }

  if (node instanceof transformationDataModel.ColumnURI) {
    var allSubElementsArray = [];
    if (node.subElements.length === 0) {
      // we terminate by this URI, return the column
      // TODO check in keywords array if this exists
      return constructColumnURINodeJsEdn(node, containingGraph);

    } else {
      // [node-uri-as-generated {sub-1's edn representation} {sub-2's edn representation} ... {sub-n's edn representation}]
      //allSubElementsVector = new jsedn.Vector([constructColumnURINodeJsEdn(node, containingGraph)]);
      nonCondSubElementsVector = new jsedn.Vector([constructColumnURINodeJsEdn(node, containingGraph)]);
      for (k = 0; k < node.subElements.length; ++k) {
        subElementEdn = constructNodeVectorEdn(node.subElements[k]);
        if (subElementEdn) {
          if (node.subElements[k] instanceof transformationDataModel.Property) {
            var parsedConditions = [];
            if (node.subElements[k].propertyCondition.length > 0) {
              var condSubElementsVector = new jsedn.Vector([constructColumnURINodeJsEdn(node, containingGraph), subElementEdn]);
              parsedConditions = parseConditions(node.subElements[k].propertyCondition);

              if (parsedConditions.length === 1) {
                allSubElementsArray.push(new jsedn.List([jsedn.sym("if"), parsedConditions[0],
                  condSubElementsVector
                ]));
              } else {
                allSubElementsArray.push(new jsedn.List([jsedn.sym("if"), parsedConditions[0], condSubElementsVector])); /*!!!!!!!!!*/
              }

            } else
              if (node.subElements[k].subElements[0].nodeCondition.length > 0) {

                var condSubElementsVector = new jsedn.Vector([constructColumnURINodeJsEdn(node, containingGraph), subElementEdn]);
                parsedConditions = parseConditions(node.subElements[k].subElements[0].nodeCondition);

                //                    console.log(parsedConditions.length);
                if (parsedConditions.length === 1) {
                  allSubElementsArray.push(new jsedn.List([jsedn.sym("if"), parsedConditions[0], condSubElementsVector]));
                } else {
                  allSubElementsArray.push(new jsedn.List([jsedn.sym("if"), parsedConditions[0], condSubElementsVector])); /*!!!!!!!!!*/
                }
              } else {
                //allSubElementsVector.val.push(subElementEdn);
                nonCondSubElementsVector.val.push(subElementEdn);
              }
          }
        }
      }
      allSubElementsArray.push(nonCondSubElementsVector);

      return allSubElementsArray;
      //return allSubElementsVector;
    }

  }

  if (node instanceof transformationDataModel.ConstantURI) {
    var allSubElementsArray = [];
    if (node.subElements.length === 0) {
      // return the column - single-noded graph
      // TODO check in keywords array if this exists
      var nodeText = constructConstantURINodeJsEdn(node, containingGraph);
      return nodeText;

    }
    /*else {
        // [node-uri-as-generated {sub-1's edn representation} {sub-2's edn representation} ... {sub-n's edn representation}]
        allSubElementsVector = new jsedn.Vector([constructConstantURINodeJsEdn(node, containingGraph)]);
        for (i = 0; i < node.subElements.length; ++i) {
          if (node.subElements[i]) {
            subElementEdn = constructNodeVectorEdn(node.subElements[i]);
            if (subElementEdn) {
              allSubElementsVector.val.push(subElementEdn);
            }
          }
        }

        return allSubElementsVector;
      }*/
    else {
      // [node-uri-as-generated {sub-1's edn representation} {sub-2's edn representation} ... {sub-n's edn representation}]
      //allSubElementsVector = new jsedn.Vector([constructColumnURINodeJsEdn(node, containingGraph)]);
      nonCondSubElementsVector = new jsedn.Vector([constructConstantURINodeJsEdn(node, containingGraph)]);
      for (k = 0; k < node.subElements.length; ++k) {
        subElementEdn = constructNodeVectorEdn(node.subElements[k]);
        if (subElementEdn) {
          if (node.subElements[k] instanceof transformationDataModel.Property) {
            var parsedConditions = [];
            if (node.subElements[k].propertyCondition.length > 0) {
              var condSubElementsVector = new jsedn.Vector([constructConstantURINodeJsEdn(node, containingGraph), subElementEdn]);
              parsedConditions = parseConditions(node.subElements[k].propertyCondition);

              if (parsedConditions.length === 1) {
                allSubElementsArray.push(new jsedn.List([jsedn.sym("if"), parsedConditions[0],
                  condSubElementsVector
                ]));
              } else {
                allSubElementsArray.push(new jsedn.List([jsedn.sym("if"), parsedConditions[0], condSubElementsVector])); /*!!!!!!!!!*/
              }

            } else
              if (node.subElements[k].subElements[0].nodeCondition.length > 0) {

                var condSubElementsVector = new jsedn.Vector([constructConstantURINodeJsEdn(node, containingGraph), subElementEdn]);
                parsedConditions = parseConditions(node.subElements[k].subElements[0].nodeCondition);

                //                    console.log(parsedConditions.length);
                if (parsedConditions.length === 1) {
                  allSubElementsArray.push(new jsedn.List([jsedn.sym("if"), parsedConditions[0], condSubElementsVector]));
                } else {
                  allSubElementsArray.push(new jsedn.List([jsedn.sym("if"), parsedConditions[0], condSubElementsVector])); /*!!!!!!!!!*/
                }
              } else {
                //allSubElementsVector.val.push(subElementEdn);
                nonCondSubElementsVector.val.push(subElementEdn);
              }
          }
        }
      }
      allSubElementsArray.push(nonCondSubElementsVector);

      return allSubElementsArray;
      //return allSubElementsVector;
    }

  }

  if (node instanceof transformationDataModel.BlankNode) {
    if (node.subElements.length === 0) {
      return constructBlankNodeJsEdn(node, containingGraph);
    } else {

      allSubElementsVector = new jsedn.Vector([]);

      for (k = 0; k < node.subElements.length; ++k) {
        subElementEdn = constructNodeVectorEdn(node.subElements[k]);

        if (subElementEdn) {
          allSubElementsVector.val.push(subElementEdn);
        }

      }

      return allSubElementsVector;
    }
  }

  /*if (node instanceof transformationDataModel.BlankNode) {
      // TODO not supported yet
    }*/
}

function constructPropertyJsEdn(property) {
  // graph URI as prefix, add nothing
  var propertyPrefix = property.prefix;
  var propertyName = property.propertyName;
  if (propertyPrefix === null) {
    alertInterface('Property prefix cannot be null:' + propertyName + '. What happened?');
    return;
  } else if (propertyPrefix === '') {

    if (isProbablyURI(propertyName)) {
      return propertyName;
    } else {
      // property name has been omitted! - in that case we use the base graph URI
      // TODO - graph URI prefixer is currently hard-coded; when new graphs are added this will not work as intended
      return new jsedn.List([new jsedn.sym('graph0'), propertyName]);
    }

  } else {
    if (isSupportedPrefix(propertyPrefix.trim())) {
      // assume it's a supported property
      return new jsedn.sym(propertyPrefix + ':' + propertyName);
    } else {
      // TODO make a check if we have defined the prefix
      // some custom prefix, that is hopefully defined in the UI (Edit Prefixes...)
      return new jsedn.sym(propertyPrefix + ':' + propertyName);
    }
  }

}

function isProbablyURI(string) {
  //    var url = new URI("foaf:asdf");
  var uriRegEx = new RegExp('^' +
    '(?:' +
    '([^:/?#]+)' + // scheme
    ':)?' +
    '(?://' +
    '(?:([^/?#]*)@)?' + // credentials
    '([^/?#:@]*)' + // domain
    '(?::([0-9]+))?' + // port
    ')?' +
    '([^?#]+)?' + // path
    '(?:\\?([^#]*))?' + // query
    '(?:#(.*))?' + // fragment
    '$');
  var match = ('' + string).match(uriRegEx);

  // probably a full URI (and not a qualified name) if it has a scheme and a domain
  if (match[1]) {
    // has a scheme
    if (match[3]) {
      // has a domain
      return true;
    }
  }

  return false;
}

function constructColumnURINodeJsEdn(colURINode, containingGraph) {
  // graph URI as prefix, add nothing
  var nodePrefix = colURINode.prefix.hasOwnProperty('id') ? colURINode.prefix.value : colURINode.prefix;

  var nodeValue = typeof colURINode.column === 'object' ? colURINode.column.value : colURINode.column;
  if (nodePrefix === null || nodePrefix === undefined) {
    // base graph URI
    // ((prefixer "graphURI") nodeValue)
    return new jsedn.List([new jsedn.List([new jsedn.sym('prefixer'), containingGraph.graphURI]), new jsedn.sym(
      nodeValue)]);
  } else if (nodePrefix === '') {
    // empty prefix - just take the column as symbol
    // nodeValue
    return new jsedn.sym(nodeValue);
  } else {
    if (isSupportedPrefix(nodePrefix.trim())) {
      // supported prefix - no need to use prefixer - simple library call
      // nodePrefix:nodeValue (e.g. vcard:Address)
      return new jsedn.sym(nodePrefix + ':' + nodeValue);
    } else {
      // TODO make a check if we have defined the prefix
      // some custom prefix, that is hopefully defined in the UI (Edit Prefixes...)
      // both are symbols and we get (nodePrefix nodeValue) as a result
      return new jsedn.List([new jsedn.sym(nodePrefix), new jsedn.sym(nodeValue.replace(/\./g, '-'))]);
    }
  }

}

function constructConstantURINodeJsEdn(constURINode, containingGraph) {
  // graph URI as prefix, add nothing
  var nodePrefix = constURINode.prefix;
  var nodeValue = constURINode.constant;
  if (nodePrefix === null || nodePrefix === undefined) {
    // base graph URI
    // ((prefixer 'graphURI') 'nodeValue')
    return new jsedn.List([new jsedn.List([new jsedn.sym('prefixer'), containingGraph.graphURI]), nodeValue]);
  } else if (nodePrefix === '') {
    // empty prefix - just take the column as symbol
    // nodeValue
    return nodeValue;
  } else {
    if (isSupportedPrefix(nodePrefix.trim())) {

      // nodePrefix:nodeValue (e.g. vcard:Address)
      return new jsedn.sym(nodePrefix + ':' + nodeValue);

    } else {
      // TODO make a check if we have defined the prefix
      // some custom prefix, that is hopefully defined in the UI (Edit Prefixes...)
      // both are symbols and we get (nodePrefix nodeValue) as a result

      return new jsedn.sym(nodePrefix + ':' + nodeValue.replace(/\./g, '-'));
    }
  }

  // prefix null, empty or undefined
}

function constructBlankNodeJsEdn(blankNode, containingGraph) {
  return new jsedn.Vector([]);
}

function tempCheckExistingVocabInGraft(prefix) {
  var vocab = ['dcat', 'dcterms', 'foaf', 'statistical-entity', 'org', 'os', 'owl', 'pmd', 'qb', 'rdf',

    'rdfs', 'sdmx-attribute', 'sdmx-concept', 'sdmx-measure', 'skos', 'vcard', 'void', 'xsd'
  ];

  for (var i = 0; i < vocab.length; i++) {
    if (vocab[i] === prefix) {
      return false;
    }
  }

  return true;
}

function tempCheckExistingClassorPropertiesInGraft(prefix, name) {
  var items = [
    'owl:Ontology', 'owl:Class',
    'foaf:Person', 'foaf:age', 'foaf:depiction', 'foaf:gender', 'foaf:homepage', 'foaf:interest', 'foaf:knows',
    'foaf:name', 'foaf:nick',
    'sdmx-measure:obsValue',
    'sdmx-concept:statUnit', 'sdmx-concept:unitMeasure',
    'rdfs', 'rdf:a', 'rdf:Property', 'rdfs:subPropertyOf', 'rdfs:Class', 'rdfs:subClassOf', 'rdfs:label',
    'rdfs:comment', 'rdfs:isDefinedBy', 'rdfs:range', 'rdfs:domain',
    'vcard:Address', 'vcard:hasAddress', 'vcard:hasUrl', 'vcard:street-address', 'vcard:postal-code',
    'vcard:locality', 'vcard:country-name',
    'qb:DataStructureDefinition', 'qb:DataSet', 'qb:dataSet', 'qb:component', 'qb:componentRequired',
    'qb:componentAttachment', 'qb:ComponentSpecification', 'qb:ComponentProperty', 'qb:Attachable', 'qb:order',
    'qb:structure', 'qb:dimension', 'qb:DimensionProperty', 'qb:attribute', 'qb:AttributeProperty', 'qb:measure',
    'qb:measureType', 'qb:MeasureProperty', 'qb:Observation', 'qb:concept', 'qb:Slice', 'qb:slice',
    'skos:ConceptScheme', 'skos:hasTopConcept', 'skos:Concept', 'skos:inScheme', 'skos:topConceptOf',
    'skos:prefLabel', 'skos:definition', 'skos:notation', 'skos:altLabel', 'skos:note', 'skos:Collection',
    'skos:member',
    'dcat:Dataset', 'dcat:theme',
    'pmd:Dataset', 'pmd:contactEmail', 'pmd:graph', 'folder:Folder', 'folder:hasTree', 'folder:defaultTree',
    'folder:parentFolder', 'folder:inFolder', 'folder:inTree',
    'os:postcode',
    'statistical-entity:name', 'statistical-entity:abbreviation', 'statistical-entity:owner',
    'statistical-entity:coverage',
    'statistical-entity:relatedentity', 'statistical-entity:status', 'statistical-entity:liveinstances',
    'statistical-entity:archivedinstances',
    'statistical-entity:coverage', 'statistical-entity:firstcode', 'statistical-entity:lastcode',
    'statistical-entity:reservedcode',
    'statistical-entity:introduced', 'statistical-entity:lastinstancechange', 'statistical-entity:code',
    'statistical-entity:crossborderinstances',
    'statistical-entity:theme', 'statistical-geography', 'statistical-geography:officialname',
    'statistical-geography:status',
    'statistical-geography:parentcode', 'boundary-change', 'boundary-change:operativedate',
    'boundary-change:originatingChangeOrder', 'boundary-change:terminateddate',
    'boundary-change:changeOrderTitle',
    'sdmx-attribute:statUnit', 'sdmx-attribute:unitMeasure',
    'dcterms:title', 'dcterms:modified', 'dcterms:created', 'dcterms:description', 'dcterms:issued',
    'dcterms:license', 'dcterms:publisher', 'dcterms:creator', 'dcterms:references', 'dcterms:isReplacedBy',
    'dcterms:replaces',
    'org:Organization',
    'void:Dataset', 'void:dataDump', 'void:sparqlEndpoint', 'void:triples', 'void:vocabulary',
  ];

  for (var i = 0; i < items.length; i++) {
    var str = prefix + ':' + name;
    if (items[i] === str) {
      return false;
    }
  }

  return true;
}

//check whether the prefix is added or not
var graphPrefix = [];

function isPrefixExist(prefix) {

  for (var i = 0; i < graphPrefix.length; i++) {
    if (graphPrefix[i] === prefix) {

      return true;
    }
  }

  graphPrefix.push(prefix);
  return false;
}

var graphConcept = [];

function isConceptExist(prefix, concept) {

  var name = prefix + ':' + concept;
  for (var i = 0; i < graphConcept.length; i++) {
    if (graphConcept[i] === name) {
      return true;
    }
  }

  graphConcept.push(name);
  return false;
}

var namespaceMap = {
  prefix: '',
  namespace: '',
};

var namespaceMaps = [];

//load a mapping between prefix and namespace from windows localStorage.
//the storage is edited in propertydialog.js and mappingnodedefinitiondialog.js
function loadNamespaceMapping(vocabularies) {
  //load user defined vocabulary
  if (!vocabularies) {
    return;
  }

  for (var i = vocabularies.length - 1; i >= 0; i--) {
    if (!vocabularies[i].fromServer && !isSupportedPrefix(vocabularies[i].name)) {
      namespaceMap = {};
      namespaceMap.prefix = vocabularies[i].name;
      namespaceMap.namespace = vocabularies[i].namespace;
      namespaceMaps.push(namespaceMap);
    }
  }
}

//get namespace based on prefix
function getNamespaceofPrefix(prefix) {
  for (var i = 0; i < namespaceMaps.length; i++) {
    if (namespaceMaps[i].prefix === prefix) {
      return namespaceMaps[i].namespace;
    }
  }

  return '';
}

// recursive function to add clojure code about property and class
function getConcept(element, str, containingGraph, prefixersInGUI) {
  var i;

  //define vocabulary
  var elementPrefix = (element.prefix !== undefined && element.prefix.hasOwnProperty('id') ? element.prefix.value : element.prefix);
  if (elementPrefix !== '' && elementPrefix !== undefined) {

    if (!isPrefixExist(elementPrefix)) {
      if (tempCheckExistingVocabInGraft(elementPrefix)) {
        var namespace = getNamespaceofPrefix(elementPrefix);
        var existsInGUI = false;
        for (i = 0; i < prefixersInGUI.length; ++i) {
          if (prefixersInGUI[i].name === elementPrefix) existsInGUI = true;
        }

        if (namespace !== '' && namespace !== undefined) {

          str += ('(def ' + elementPrefix + ' (prefixer ' + '"' + namespace + '"' + ')) ');
          str += '\n';
        } else if (!existsInGUI) {
          str += ('(def ' + elementPrefix + ' (prefixer ' + '"' + containingGraph.graphURI + '"' + '))');
          str += '\n';
        }
      }
    }

    //define property
    if (element.__type === 'Property') {
      if (!isConceptExist(element.prefix, element.propertyName)) {
        if (tempCheckExistingClassorPropertiesInGraft(element.prefix, element.propertyName)) {
          str += '(def ' + element.prefix + ':' + element.propertyName + ' (' + element.prefix + ' "' + element.propertyName +
            '"))';
          str += '\n';
        }
      }
    }

    //define class
    if (element.__type === 'ConstantURI') {
      if (!isConceptExist(element.prefix, element.constant)) {
        if (tempCheckExistingClassorPropertiesInGraft(element.prefix, element.constant)) {
          str += '(def ' + element.prefix + ':' + element.constant.replace(/\./g, '-') + ' (' + element.prefix + ' "' + element.constant +
            '"))';
          str += '\n';
        }
      }
    }
  }

  //recursive: do the same for all sub elements
  for (i = 0; i < element.subElements.length; i++) {
    str = getConcept(element.subElements[i], str, containingGraph, prefixersInGUI);
  }

  return str;
}

function generateGrafterCode(transformation) {
  /* Grafter Declarations */

  // TODO those are not needed here; may be needed afterwards?
  //    var grafterDeclarations = constructGrafterDeclarations();
  if (!transformation) return '';

  /* Prefixers */
  graphPrefix = [];
  graphConcept = [];
  var prefixersInGUI = transformation.prefixers;
  // add only custom prefixers - the Grafter ones are available by default
  for (var i = 0; i < prefixersInGUI.length; ++i) {
    var name = prefixersInGUI[i].name;
    var uri = prefixersInGUI[i].uri;
    var parentPrefix = prefixersInGUI[i].parentPrefix;
    if (name === '' || uri === '') {
      alertInterface('Name or URI of a prefix empty, ignoring...', '');
      continue;
    }

    addGrafterPrefixer(name, uri, parentPrefix);
  }

  // add prefixers for each graph

  for (i = 0; i < transformation.graphs.length; ++i) {
    addGrafterPrefixer('graph' + i, transformation.graphs[i].graphURI, '');
  }

  var grafterPrefixers = constructGrafterPrefixersArray();
  /* User functions */

  //    var customFunctionsMap = transformation.customFunctionDeclarations;
  for (i = 0; i < transformation.customFunctionDeclarations.length; ++i) {
    /*Regex parsing*/
    var codeToParse = transformation.customFunctionDeclarations[i].clojureCode;
    var regexesPattern = /#"(.*?)"/g;

    var regexes = regexesPattern.exec(codeToParse);
    var newstring;
    while (regexes) {

      newstring = regexes[0].replace('#"', ' (read-string "#\\"');
      newstring = newstring.replace(/"$/, '\\"")');
      codeToParse = codeToParse.replace(regexes[0], newstring);
      regexes = regexesPattern.exec(codeToParse);
    }

    parseAndAddUserFunction(codeToParse);

  }

  var grafterCustomFunctions = constructUserFunctions();
  /* Graph Template */
  var graphTemplate = constructRDFGraphFunction(transformation);

  /* Pipeline Function */
  transformation.pipelines.forEach(function (pipeline) {
    pipeline.functions.forEach(function (genericFunction) {
      addPipelineFunction(genericFunction);
    });
  });

  var resultingPipeline = constructPipeline();
  var textStr = '';

  if (grafterPrefixers.length) {
    for (i = 0; i < grafterPrefixers.length; ++i) {
      textStr += (grafterPrefixers[i].ednEncode() + '\n');
    }

    textStr += '\n';
  }

  loadNamespaceMapping(transformation.rdfVocabs);
  if (transformation.graphs.length > 0) {
    for (i = 0; i < transformation.graphs.length; ++i) {
      if (transformation.graphs[i].graphRoots) {
        if (transformation.graphs[i].graphRoots.length > 0) {
          for (var j = 0; j < transformation.graphs[i].graphRoots.length; j++)
            textStr = getConcept(transformation.graphs[i].graphRoots[j], textStr, transformation.graphs[i],
              prefixersInGUI);
        }
      }
    }

    textStr += '\n';
  }

  for (i = 0; i < grafterCustomFunctions.length; ++i) {
    textStr += (grafterCustomFunctions[i].ednEncode() + '\n');
  }

  textStr += graphTemplate.ednEncode();

  textStr += '\n';
  textStr += '\n';
  textStr += (resultingPipeline.ednEncode());

  textStr += '\n';
  textStr += '\n';

  textStr +=
    '(defgraft my-graft "Transformation that converts input CSV data into RDF graph data." my-pipe make-graph)';
  return textStr;
}

export function fromTransformation(transformation) {
  try {
    var generatedCode = generateGrafterCode(transformation);

    return generatedCode;
  } catch (e) {
    // Raven.captureException(e);
    console.error(e);
    // TODO print some error pls
    return '';
  }
};
import * as jsedn from 'jsedn';

var _this = this || {};

export function Prefixer(name, uri, parentPrefix) {
  this.name = name;
  this.uri = uri;
  this.parentPrefix = parentPrefix;
  this.__type = 'Prefixer';
};
Prefixer.revive = function (data) {
  return new Prefixer(data.name, data.uri, data.parentPrefix);
};
_this.Prefixer = Prefixer;

export function GenericFunction() {
  if (!this.generateClojure) {
    this.generateClojure = function () {
      return new jsedn.List([jsedn.sym(this.name)]);
    };
  }
  // shows if we are currently previewing the partial transformation up to that function
  this.isPreviewed = false;
};

export function CustomFunctionDeclaration(name, clojureCode, group, docstring) {
  this.name = name;
  this.clojureCode = clojureCode;
  this.group = group;
  this.docstring = docstring;
  this.__type = 'CustomFunctionDeclaration';
};
CustomFunctionDeclaration.revive = function (data) {
  return new CustomFunctionDeclaration(data.name, data.clojureCode, data.group, data.docstring);
};
_this.CustomFunctionDeclaration = CustomFunctionDeclaration;

export function DropRowsFunction(indexFrom, indexTo, take, docstring) {
  GenericFunction.call(this);
  this.indexFrom = indexFrom;
  this.indexTo = indexTo;
  this.name = 'drop-rows';
  if (take) this.displayName = 'take-rows';
  else this.displayName = 'drop-rows';
  if (!docstring) this.docstring = (take ? 'Take ' : 'Drop ') + 'rows with indices from ' + indexFrom + ' to ' + indexTo;
  else this.docstring = docstring;
  this.take = take;
  this.__type = 'DropRowsFunction';
};
DropRowsFunction.revive = function (data) {
  var indexFrom;
  var indexTo;

  if (!data.hasOwnProperty('indexFrom')) {
    indexFrom = 0;
    indexTo = data.numberOfRows;
  } else {
    indexFrom = data.indexFrom;
    indexTo = data.indexTo;
  }

  return new DropRowsFunction(indexFrom, indexTo, data.take, data.docstring);
};
DropRowsFunction.prototype = Object.create(GenericFunction.prototype);
DropRowsFunction.prototype.generateClojure = function () {
  if (this.take === false && this.indexFrom === 0)
    return new jsedn.List([jsedn.sym('drop-rows'), this.indexTo]);
  var values = [jsedn.sym('rows')];
  if (this.take) values.push(new jsedn.List([jsedn.sym('range'),
  this.indexFrom,
  this.indexTo + 1
  ]));
  else values.push(new jsedn.List([jsedn.sym('concat'),
  new jsedn.List([jsedn.sym('range'),
    0,
  this.indexFrom
  ]),
  new jsedn.List([jsedn.sym('drop'),
  this.indexTo + 1,
  new jsedn.List([jsedn.sym('range')])
  ])
  ]));

  return new jsedn.List(values);
};
_this.DropRowsFunction = DropRowsFunction;

export function SplitFunction(colName, separator, docstring) {
  GenericFunction.call(this);
  this.colName = colName;
  this.separator = separator;
  this.name = 'split';
  this.displayName = 'split';
  if (!docstring) this.docstring = 'Split column ' + colName.value + ' on' + separator;
  else this.docstring = docstring;
  this.__type = 'SplitFunction';
};
SplitFunction.revive = function (data) {
  var colName;
  if (!data.colName.hasOwnProperty('id')) colName = {
    id: 0,
    value: data.colName
  };
  else colName = data.colName;
  return new SplitFunction(colName, data.separator, data.docstring);
};
SplitFunction.prototype = Object.create(GenericFunction.prototype);
SplitFunction.prototype.generateClojure = function () {

  var regex = new jsedn.List([jsedn.sym('read-string'), '#\"' + this.separator + '\"']);
  return new jsedn.List([jsedn.sym('new-tabular/split-column'), jsedn.kw(':' + this.colName.value), regex]);
};
_this.SplitFunction = SplitFunction;

export function FunctionWithArgs(funct, functParams) {
  this.funct = funct;
  this.functParams = functParams;
  this.__type = 'FunctionWithArgs';
};
FunctionWithArgs.prototype.getParams = function () {
  var params = [];
  if (!this.funct) return params;
  if (!this.funct.hasOwnProperty('clojureCode')) return params;
  if (!this.funct.clojureCode) return params;
  var d = this.funct.clojureCode.match(/\[(.*?)\]/g);
  if (d) {
    d[0] = d[0].replace(/^\[|\]$/g, '');
    params = d[0].split(" ");
    params.splice(0, 1);
  }
  return params;
};
FunctionWithArgs.revive = function (data) {
  return new FunctionWithArgs(data.funct, data.functParams);
};
_this.FunctionWithArgs = FunctionWithArgs;

export function UtilityFunction(functionName, docstring) {
  GenericFunction.call(this);
  if (functionName !== null) {
    if (!functionName instanceof FunctionWithArgs) {
      functionName = new FunctionWithArgs(functionName);
    }
  }
  this.functionName = functionName;

  if ((!docstring) && functionName) this.docstring = 'Apply ' + functionName.name + ' to dataset';
  else this.docstring = docstring;
  this.name = 'utility';
  if (functionName.funct) {
    this.displayName = functionName.funct.name;
  }
  this.__type = 'UtilityFunction';
};
UtilityFunction.revive = function (data) {
  // return new UtilityFunction(data.functionName, data.params, data.docstring);
  var newFunct = data.functionName;
  if (data.functionName instanceof FunctionWithArgs === false) {
    if (data.functionName.__type === 'FunctionWithArgs') {
      newFunct = FunctionWithArgs.revive(data.functionName);
    } else {

      newFunct = new FunctionWithArgs(data.functionName, []);
    }

  }
  return new UtilityFunction(newFunct, data.docstring);
};
UtilityFunction.prototype = Object.create(GenericFunction.prototype);
UtilityFunction.prototype.generateClojure = function () {
  var elems = [jsedn.sym(this.functionName.funct.name)];
  for (var i = 0; i < this.functionName.functParams.length; ++i) {
    elems.push(this.functionName.functParams[i]);
  }

  return new jsedn.List(elems);
};
_this.UtilityFunction = UtilityFunction;

export function AddColumnsFunction(columnsArray, docstring) {
  GenericFunction.call(this);
  this.name = 'add-columns';
  this.displayName = 'add-columns';
  var i;
  var colProps;
  if (columnsArray !== null) {
    for (i = 0; i < columnsArray.length; ++i) {
      colProps = columnsArray[i];
      if (colProps !== null) {
        if (!(colProps instanceof NewColumnSpec) && colProps.__type === 'NewColumnSpec') {
          columnsArray[i] = NewColumnSpec.revive(colProps);
        }
      }
    }
  }

  this.columnsArray = columnsArray;
  if (!docstring) this.docstring = 'Add new column' + (columnsArray.length === 1 ? '' : 's');
  else this.docstring = docstring;
  this.__type = 'AddColumnsFunction';
};
AddColumnsFunction.revive = function (data) {
  return new AddColumnsFunction(data.columnsArray, data.docstring);
};
AddColumnsFunction.prototype = Object.create(GenericFunction.prototype);
AddColumnsFunction.prototype.generateClojure = function () {
  var i;
  var newRownumMap = new jsedn.Map([]);
  var newColMap = new jsedn.Map([]);
  var ds = [];

  for (i = 0; i < this.columnsArray.length; ++i) {
    switch (this.columnsArray[i].specValue) {
      case ('Dataset filename'):
        ds.push(new jsedn.List([
          new jsedn.sym('add-filename-to-column'),
          new jsedn.kw(':' + this.columnsArray[i].colName)
        ]));
        break;
      case ('Current date'):
        newColMap.set(
          new jsedn.kw(':' + this.columnsArray[i].colName),
          new jsedn.List([
            new jsedn.sym('new'),
            new jsedn.sym('java.util.Date')
          ])
        );
        break;
      case ('Row number'):
        newRownumMap.set(
          new jsedn.kw(':' + this.columnsArray[i].colName),
          new jsedn.parse('(fn [_] (grafter.sequences/integers-from 1))')
        );
        break;
      case ('custom expression'):
        newColMap.set(
          new jsedn.kw(':' + this.columnsArray[i].colName),
          new jsedn.parse(this.columnsArray[i].expression)
        );
        break;
      default:
        newColMap.set(
          new jsedn.kw(':' + this.columnsArray[i].colName),
          this.columnsArray[i].colValue
        );
        break;
    }

  }

  var pipe = [new jsedn.sym('->')];

  if (ds.length !== 0) {
    if (ds.length === 1) {
      return ds[0];
    } else {
      pipe = pipe.concat(ds);
      return new jsedn.List(pipe);
    }
  }

  pipe = pipe.concat(ds);
  pipe.push(new jsedn.List([jsedn.sym('add-columns'), newColMap]));

  if (newRownumMap.keys.length !== 0) {
    pipe.push(new jsedn.List([jsedn.sym('apply-columns'), newRownumMap]));
    return new jsedn.List(pipe);
  } else {
    return new jsedn.List([jsedn.sym('add-columns'), newColMap]);
  }
};
_this.AddColumnsFunction = AddColumnsFunction;

export function AddColumnFunction(newColName, fileName, colValue, colExpr, docstring) {
  GenericFunction.call(this);
  this.newColName = newColName;
  this.colValue = colValue;
  this.colExpr = colExpr;
  this.fileName = fileName;
  this.name = 'add-column';
  this.displayName = 'add-column';
  if (!docstring) this.docstring = 'Add new column ' + newColName;
  else this.docstring = docstring;
  this.__type = 'AddColumnFunction';
};
AddColumnFunction.revive = function (data) {
  return new AddColumnFunction(data.newColName, data.fileName, data.colValue, data.colExpr, data.docstring);
};
AddColumnFunction.prototype = Object.create(GenericFunction.prototype);
AddColumnFunction.prototype.generateClojure = function () {
  if (this.fileName) return new jsedn.List([jsedn.sym('add-filename-to-column'), new jsedn.kw(':' + this.newColName)]);
  if (!this.colExpr) return new jsedn.List([jsedn.sym('add-column'), new jsedn.kw(':' + this.newColName), this.colValue]);
  else {
    return new jsedn.List([jsedn.sym('add-column'), new jsedn.kw(':' + this.newColName), jsedn.parse(this.colExpr)]);
  }

};
_this.AddColumnFunction = AddColumnFunction;

export function GrepFunction(take, grepmode, colsToFilter, functionsToFilterWith, filterText, filterRegex, ignoreCase, docstring) {
  GenericFunction.call(this);
  this.take = take;
  this.grepmode = grepmode;
  this.colsToFilter = colsToFilter;
  this.name = 'grep';
  this.displayName = 'grep';
  this.filterRegex = filterRegex;
  this.ignoreCase = ignoreCase;
  var filterFunc;
  if (functionsToFilterWith !== null) {
    for (var i = 0; i < functionsToFilterWith.length; ++i) {
      filterFunc = functionsToFilterWith[i];
      if (filterFunc !== null && filterFunc !== undefined) {
        if (!(filterFunc instanceof CustomFunctionDeclaration) && filterFunc.__type ===
          'CustomFunctionDeclaration') {
          functionsToFilterWith[i] = CustomFunctionDeclaration.revive(filterFunc);
        }

        if (!(filterFunc instanceof Prefixer) && filterFunc.__type === 'Prefixer') {
          functionsToFilterWith[i] = Prefixer.revive(filterFunc);
        }
      }
    }
  }

  this.functionsToFilterWith = functionsToFilterWith;
  this.__type = 'GrepFunction';
  if (!docstring)
    this.docstring = 'Filter dataset';

  else this.docstring = docstring;
  this.filterText = filterText;
};
GrepFunction.revive = function (data) {
  var take;
  var grepmode;
  if (!data.hasOwnProperty('take'))
    take = true;
  else take = data.take;
  if (!data.hasOwnProperty('grepmode'))
    grepmode = data.filterText ? 'text' : (data.filterRegex ? 'regex' : 'function');
  else grepmode = data.grepmode;
  var columnsArray = [];
  if (data.colsToFilter.length > 0 && data.colsToFilter[0] && !data.colsToFilter[0].hasOwnProperty('id')) {
    for (var i = 0; i < data.colsToFilter.length; ++i) {
      var colname = {
        id: i,
        value: data.colsToFilter[i]
      };
      columnsArray.push(colname);
    }
  } else {
    columnsArray = data.colsToFilter;
  }
  return new GrepFunction(take, grepmode, columnsArray, data.functionsToFilterWith, data.filterText, data.filterRegex,
    data.ignoreCase,
    data.docstring);
};
GrepFunction.prototype = Object.create(GenericFunction.prototype);
GrepFunction.prototype.generateClojure = function () {
  var colsToFilter = new jsedn.Vector([]);
  var flag = false;
  var filterFunc;
  var i;
  for (i = 0; i < this.colsToFilter.length; ++i) {
    colsToFilter.val.push(new jsedn.kw(':' + this.colsToFilter[i].value));
    flag = true;
  }

  var values = [jsedn.sym('grep')];
  //var opt = this.filterText ? 'txt' : (this.filterRegex ? 'regex' : 'funs');
  var regexParsed;

  switch (this.grepmode) {

    case ('text'):
      if (this.ignoreCase) {
        regexParsed = '#\"(?i).*' + this.filterText + '.*\"';

        if (!this.take) {
          values.push(new jsedn.List([jsedn.sym('comp'), jsedn.sym('not'), new jsedn.List([jsedn.parse('fn [cell]'),
          new jsedn.List([jsedn.sym('re-find'), new jsedn.List([jsedn.sym('read-string'), regexParsed]), jsedn.parse('(str cell)')])
          ])]));

        } else {
          values.push(new jsedn.List([jsedn.sym('read-string'), regexParsed]));
        }
      } else {
        if (!this.take)
          values.push(new jsedn.List([jsedn.sym('comp'), jsedn.sym('not'), new jsedn.List([jsedn.parse('fn [^String cell] (.contains (str cell) \"' + this.filterText + '\")')])]));
        else
          values.push(this.filterText);
      }
      break;

    case ('regex'):
      regexParsed = '#\"' + this.filterRegex + '\"';
      if (!this.take)
        values.push(new jsedn.List([jsedn.sym('comp'), jsedn.sym('not'), new jsedn.List([jsedn.parse('fn [cell] (re-find (read-string ' + regexParsed + ' ) (str cell))')])]));
      else
        values.push(new jsedn.List([jsedn.sym('read-string'), regexParsed]));
      break;

    case ('function'):
      var functions = [];
      if (this.functionsToFilterWith.length === 1) {
        functions.push(jsedn.sym(this.functionsToFilterWith[0].name));
      } else {
        var comp = [jsedn.sym('comp')];
        for (i = 0; i < this.functionsToFilterWith.length; ++i) {
          filterFunc = this.functionsToFilterWith[i];
          comp.push(jsedn.sym(filterFunc.name));
        }

        functions.push(new jsedn.List(comp));
      }
      if (!this.take) {
        functions.unshift(jsedn.sym('not'));
        functions.unshift(jsedn.sym('comp'));
        values.push(new jsedn.List(functions));
      } else
        values = values.concat(functions);

      break;

    default:
      Raven.captureMessage('Error in defining  grep option', {
        tags: {
          file: 'transformationdatamodel',
          method: 'GrepFunction.generateClojure'
        }
      });
      break;
  }
  if (this.colsToFilter.length > 0)
    values.push(colsToFilter);

  return new jsedn.List(values);
};
_this.GrepFunction = GrepFunction;

export function MergeColumnsFunction(colsToMerge, separator, newColName, docstring) {
  GenericFunction.call(this);
  this.newColName = newColName;
  this.colsToMerge = colsToMerge;
  this.name = 'merge-columns';
  this.displayName = 'merge-columns';
  if (!separator)
    this.separator = '';
  else
    this.separator = separator;
  this.__type = 'MergeColumnsFunction';
  if (!docstring && colsToMerge[0]) {
    this.docstring = 'Merge columns ';
    for (var i = 0; i < colsToMerge.length; ++i) {
      this.docstring += '' + colsToMerge[i].value + ' ';
    }
  } else {
    this.docstring = docstring;
  }
};
MergeColumnsFunction.revive = function (data) {
  return new MergeColumnsFunction(data.colsToMerge, data.separator, data.newColName,
    data.docstring);
};
MergeColumnsFunction.prototype = Object.create(GenericFunction.prototype);
MergeColumnsFunction.prototype.generateClojure = function () {
  var colsToMerge = new jsedn.Vector([]);
  var i;

  for (i = 0; i < this.colsToMerge.length; ++i) {
    colsToMerge.val.push(new jsedn.kw(':' + this.colsToMerge[i].value));
  }
  var regex = new jsedn.List([jsedn.sym('read-string'), '#\"' + this.separator + '\"']);
  return new jsedn.List([jsedn.sym('new-tabular/merge-columns'), colsToMerge, regex, jsedn.kw(':' + this.newColName)]);
};
_this.MergeColumnsFunction = MergeColumnsFunction;

export function DeriveColumnFunction(newColName, colsToDeriveFrom, functionsToDeriveWith, docstring) {
  GenericFunction.call(this);
  this.newColName = newColName;
  this.colsToDeriveFrom = colsToDeriveFrom;
  this.name = 'derive-column';
  this.displayName = 'derive-column';
  var i;
  var funct_args;
  if (functionsToDeriveWith !== null) {
    for (i = 0; i < functionsToDeriveWith.length; ++i) {
      funct_args = functionsToDeriveWith[i];
      if (funct_args !== null) {
        if (!funct_args instanceof FunctionWithArgs) {
          functionsToDeriveWith[i] = new FunctionWithArgs(funct_args);
        }
      }
    }
  }
  this.functionsToDeriveWith = functionsToDeriveWith;
  this.__type = 'DeriveColumnFunction';
  if (!docstring) {
    this.docstring = 'Derive column ' + newColName + ' from column(s) ';
    for (i = 0; i < colsToDeriveFrom.length; ++i) {
      this.docstring += '' + colsToDeriveFrom[i].value + ' ';
    }
  } else {
    this.docstring = docstring;
  }
};
DeriveColumnFunction.revive = function (data) {
  var columnsArray = [];
  if (data.colsToDeriveFrom.length > 0 && !data.colsToDeriveFrom[0].hasOwnProperty('id')) {
    for (var i = 0; i < data.colsToDeriveFrom.length; ++i) {
      var colname = {
        id: i,
        value: data.colsToDeriveFrom[i]
      };
      columnsArray.push(colname);
    }
  } else columnsArray = data.colsToDeriveFrom;
  var functionsArray = [];

  for (var i = 0; i < data.functionsToDeriveWith.length; ++i) {
    if (data.functionsToDeriveWith[i] instanceof FunctionWithArgs === false) {
      var newFunct;
      if (data.functionsToDeriveWith[i].__type === 'FunctionWithArgs') {

        newFunct = FunctionWithArgs.revive(data.functionsToDeriveWith[i]);
        functionsArray.push(newFunct);
      } else {
        newFunct = {
          name: data.functionsToDeriveWith[i].name,
          id: 0,
          group: (data.functionsToDeriveWith[i].hasOwnProperty('group') ? data.functionsToDeriveWith[i].group : 'PREFIXERS')
        };

        //               var newFunct = new FunctionWithArgs({funct:data.functionsToDeriveWith[i],functParams:[]});
        functionsArray.push(new FunctionWithArgs(newFunct, []));
      }
    } else functionsArray.push(data.functionsToDeriveWith[i]);
  }
  return new DeriveColumnFunction(data.newColName, columnsArray, functionsArray, data.paramsToFunctions,
    data.docstring);
};
DeriveColumnFunction.prototype = Object.create(GenericFunction.prototype);
DeriveColumnFunction.prototype.generateClojure = function () {
  var colsToDeriveFromClj = new jsedn.Vector([]);
  var flag = false;
  var deriveFunc;
  var functWithParams = [];
  var i;
  for (i = 0; i < this.colsToDeriveFrom.length; ++i) {
    colsToDeriveFromClj.val.push(new jsedn.kw(':' + this.colsToDeriveFrom[i].value));
    flag = true;
  }

  var values = [jsedn.sym('derive-column'),
  this.newColName ? new jsedn.kw(':' + this.newColName) : new jsedn.kw(':unnamed'),
    colsToDeriveFromClj
  ];
  var deriveFuncts = [];
  for (i = 0; i < this.functionsToDeriveWith.length; ++i) {
    if (this.functionsToDeriveWith[i].functParams.length === 0)
      deriveFuncts.push(new jsedn.sym(this.functionsToDeriveWith[i].funct.name));
    else {
      functWithParams = [new jsedn.sym(this.functionsToDeriveWith[i].funct.name), new jsedn.sym('arg')];
      functWithParams = functWithParams.concat(this.functionsToDeriveWith[i].functParams);
      deriveFuncts.push(new jsedn.List([new jsedn.parse('fn [arg]'),
      new jsedn.List(functWithParams)
      ]));
    }
  }
  if (deriveFuncts.length === 1) {
    values.push(deriveFuncts[0]);
  } else {
    var compFuncts = ['comp'];
    compFuncts = compFuncts.concat(deriveFuncts);
    values.push(new jsedn.List(compFuncts));
  }
  return new jsedn.List(values);
};
_this.DeriveColumnFunction = DeriveColumnFunction;

export function GroupRowsFunction(colnames, colnamesFunctionsSet, separatorSet, docstring) {
  GenericFunction.call(this);
  this.name = 'group-rows';
  this.displayName = 'group-rows';
  this.colnames = colnames;
  this.colnamesFunctionsSet = colnamesFunctionsSet;
  this.separatorSet = separatorSet;
  this.__type = 'GroupRowsFunction';
  if (!docstring) {
    this.docstring = 'Group rows by column(s): ';
    if (colnames.length > 0) {
      for (var i = 0; i < colnames.length; ++i) {
        this.docstring += colnames[i].value + ' ';
      }
    }
  } else {
    this.docstring = docstring;
  }
};
GroupRowsFunction.revive = function (data) {
  return new GroupRowsFunction(data.colnames, data.colnamesFunctionsSet, data.separatorSet, data.docstring);
};
GroupRowsFunction.prototype = Object.create(GenericFunction.prototype);
GroupRowsFunction.prototype.generateClojure = function () {
  var colnames = new jsedn.Vector([]);
  var i;

  for (i = 0; i < this.colnames.length; ++i) {
    colnames.val.push(jsedn.kw(':' + this.colnames[i].value));
  }
  var set = new jsedn.Set([]);
  for (i = 0; i < this.colnamesFunctionsSet.length; i += 2) {
    var colnameFunctionPair = new jsedn.Map([]);
    colnameFunctionPair.set(new jsedn.kw(':' + this.colnamesFunctionsSet[i].value),
      (this.colnamesFunctionsSet[i + 1] === "MERGE" ? this.separatorSet[i] : this.colnamesFunctionsSet[i + 1]));
    set.val.push(colnameFunctionPair);
  }

  return new jsedn.List([jsedn.sym('new-tabular/group-rows'), colnames, set]);
};
_this.GroupRowsFunction = GroupRowsFunction;

export function UploadDatasetFunction(selectedType, typeList, delimiter, sheetNames, selectedSheet, extension, docstring) {
  GenericFunction.call(this);
  this.name = 'upload-dataset';
  this.displayName = 'upload-dataset';
  this.selectedType = selectedType;
  this.typeList = typeList;
  this.delimiter = delimiter;
  this.sheetNames = sheetNames;
  this.selectedSheet = selectedSheet;
  this.extension = extension;

  this.__type = 'UploadDatasetFunction';
  if (!docstring) {
    this.docstring = 'Reads the input data for the data transformation \n Cannot be moved or removed';
  } else {
    this.docstring = docstring;
  }

};
UploadDatasetFunction.revive = function (data) {
  return new UploadDatasetFunction(data.selectedType, data.typeList, data.delimiter, data.sheetNames, data.selectedSheet, data.extension, data.docstring);
};
UploadDatasetFunction.prototype = Object.create(GenericFunction.prototype);
UploadDatasetFunction.prototype.generateClojure = function () {
  var values = [];

  if (this.selectedType == "CSV") {
    values.push(jsedn.sym('read-dataset'));
    values.push(jsedn.sym('data-file'));
    values.push(jsedn.sym(':format'));
    values.push(jsedn.sym(':csv'));
    values.push(jsedn.sym(':separator'));
    if (this.delimiter == "tab" || this.delimiter == "t") {
      values.push(jsedn.sym('\\tab'));
    } else {
      values.push(new jsedn.List([jsedn.sym('first'), new jsedn.List([jsedn.sym('char-array'), this.delimiter])]));
    }
  } else if (this.selectedType == "Excel" && this.selectedSheet) {
    values.push(jsedn.sym('read-dataset'));
    values.push(jsedn.sym('data-file'));
    values.push(jsedn.sym(':format'));
    values.push(jsedn.sym(':' + this.extension));

    values.push(jsedn.sym(':sheet'));
    values.push(this.selectedSheet);
  } else if (this.selectedType == "Shape") {
    values.push(jsedn.sym('read-shape-csv'));
    values.push(jsedn.sym('data-file'));
  }

  return new jsedn.List(values);
};
_this.UploadDatasetFunction = UploadDatasetFunction;

export function RenameColumnsFunction(functionsToRenameWith, mappings, docstring) {
  GenericFunction.call(this);
  this.name = 'rename-columns';
  this.displayName = 'rename-columns';
  this.mappings = mappings;
  var renameFunc;
  var i;

  if (functionsToRenameWith !== null) {
    for (i = 0; i < functionsToRenameWith.length; ++i) {
      renameFunc = functionsToRenameWith[i];
      if (renameFunc !== null) {
        if (!(renameFunc instanceof CustomFunctionDeclaration) && renameFunc.__type ===
          'CustomFunctionDeclaration') {
          functionsToRenameWith[i] = CustomFunctionDeclaration.revive(renameFunc);
        }

        if (!(renameFunc instanceof Prefixer) && renameFunc.__type === 'Prefixer') {
          functionsToRenameWith[i] = Prefixer.revive(renameFunc);
        }
      }
    }
  }
  /*    if (functionToRenameWith!==null)  {

            if (!(functionToRenameWith instanceof CustomFunctionDeclaration) && functionToRenameWith.__type ===
           'CustomFunctionDeclaration') {
            functionToRenameWith = CustomFunctionDeclaration.revive(functionToRenameWith);
        }

        if (!(functionToRenameWith instanceof Prefixer) && functionToRenameWith.__type === 'Prefixer') {
            functionToRenameWith = Prefixer.revive(functionToRenameWith);
        }
        }*/

  this.functionsToRenameWith = functionsToRenameWith;
  this.__type = 'RenameColumnsFunction';
  if (!docstring) {
    this.docstring = 'Rename columns by applying ';
    if (!mappings[0]) {
      if (functionsToRenameWith !== null) {
        for (i = 0; i < functionsToRenameWith.length; ++i) {
          if (i === 1) this.docstring += 'composed with ';
          renameFunc = functionsToRenameWith[i];
          if (renameFunc !== null) this.docstring += renameFunc.name + ' ';
        }
      }

      this.docstring += 'function(s).';
    } else {
      this.docstring += ' map';
    }
  } else {
    this.docstring = docstring;
  }
};
RenameColumnsFunction.revive = function (data) {
  var mappings = [];
  if (data.mappings.length > 0)
    if (data.mappings[0] && !data.mappings[0].hasOwnProperty('id')) {
      for (var i = 0; i < data.mappings.length; ++i) {
        mappings.push((i % 2) ? data.mappings[i] : {
          id: i / 2,
          value: data.mappings[i]
        });
      }
    } else
      mappings = data.mappings;
  return new RenameColumnsFunction(data.functionsToRenameWith, mappings, data.docstring);
};
RenameColumnsFunction.prototype = Object.create(GenericFunction.prototype);
RenameColumnsFunction.prototype.generateClojure = function () {
  var i;

  if (!this.mappings[0]) {
    var renameFunc;
    if (this.functionsToRenameWith.length === 1) {
      renameFunc = this.functionsToRenameWith[0];
      return new jsedn.List([jsedn.sym('rename-columns'), jsedn.sym(renameFunc.name)]);
    } else {
      // (rename-columns (comp funct1 funct2))
      var comp = 'comp ';

      for (i = 0; i < this.functionsToRenameWith.length; ++i) {
        renameFunc = this.functionsToRenameWith[i];
        comp += renameFunc.name + ' ';
      }

      return new jsedn.List([jsedn.sym('rename-columns'), new jsedn.List([jsedn.parse(comp)])]);
    }
  } else {
    //rename with mapping
    var mapPairs = new jsedn.Map([]);
    for (i = 0; i < this.mappings.length; i += 2)
      mapPairs.set(new jsedn.kw(':' + this.mappings[i].value),
        new jsedn.kw(':' + this.mappings[i + 1])
      );
    return new jsedn.List([jsedn.sym('rename-columns'), mapPairs]);
  }
};
RenameColumnsFunction.prototype.removeRenameFunction = function (index) {

  this.functionsToRenameWith.splice(index, 1);
  return true;
};
_this.RenameColumnsFunction = RenameColumnsFunction;

export function KeyFunctionPair(key, funcName, funcParams) {
  this.key = key;
  this.func = funcName;
  this.funcParams = funcParams;
  this.__type = 'KeyFunctionPair';
};
KeyFunctionPair.revive = function (data) {
  var key;
  var params;
  if (!data.key.hasOwnProperty('id'))
    key = {
      id: 0,
      value: data.key
    };
  else
    key = data.key;
  if (!data.hasOwnProperty('funcParams'))
    params = [];
  else
    params = data.funcParams;
  return new KeyFunctionPair(key, data.func, params);
};
KeyFunctionPair.prototype.getParams = function () {
  var params = [];
  if (!this.func.hasOwnProperty('clojureCode')) return params;
  if (!this.func.clojureCode) return params;
  var d = this.func.clojureCode.match(/\[(.*?)\]/g);
  if (d) {
    d[0] = d[0].replace(/^\[|\]$/g, '');
    params = d[0].split(" ");
    params.splice(0, 1);
  }
  return params;
};
_this.KeyFunctionPair = KeyFunctionPair;

export function NewColumnSpec(colName, colValue, specValue, expression) {
  this.colName = colName;
  this.colValue = colValue;
  this.specValue = specValue;
  this.expression = expression;
  this.__type = 'NewColumnSpec';
};
NewColumnSpec.revive = function (data) {
  return new NewColumnSpec(data.colName, data.colValue, data.specValue, data.expression);
};
_this.NewColumnSpec = NewColumnSpec;

export function ApplyColumnsFunction(keyFunctionPairs, docstring) {
  // array of obj with [key, function]
  GenericFunction.call(this);
  this.name = 'apply-columns';
  this.displayName = 'apply-columns';
  var i;
  var kfPair;
  if (keyFunctionPairs !== null) {
    for (i = 0; i < keyFunctionPairs.length; ++i) {
      kfPair = keyFunctionPairs[i];
      if (kfPair !== null) {
        if (!(kfPair instanceof KeyFunctionPair) && kfPair.__type === 'KeyFunctionPair') {
          keyFunctionPairs[i] = KeyFunctionPair.revive(kfPair);
        }
      }
    }
  }

  if (!docstring) this.docstring = 'Map columns'; //TODO:detailed docstring
  else this.docstring = docstring;
  this.keyFunctionPairs = keyFunctionPairs;
  this.__type = 'ApplyColumnsFunction';
};
ApplyColumnsFunction.revive = function (data) {
  return new ApplyColumnsFunction(data.keyFunctionPairs, data.docstring);
};
ApplyColumnsFunction.prototype = Object.create(GenericFunction.prototype);
ApplyColumnsFunction.prototype.generateClojure = function () {
  var i;
  var keyFunctionPairsClj = new jsedn.Map([]);

  for (i = 0; i < this.keyFunctionPairs.length; ++i) {
    keyFunctionPairsClj.set(
      new jsedn.kw(':' + this.keyFunctionPairs[i].key),
      new jsedn.parse(this.keyFunctionPairs[i].func)
    );
  }

  return new jsedn.List([jsedn.sym('apply-columns'), keyFunctionPairsClj]);
};
ApplyColumnsFunction.prototype.removeKeyFunctionPair = function (kfPair) {
  var index = this.keyFunctionPairs.indexOf(kfPair);
  if (index === -1 || kfPair === null || kfPair === undefined) {
    Raven.captureMessage('tried to remove non-existing function', {
      tags: {
        file: 'transformationdatamodel',
        method: 'removeKeyFunctionPair'
      }
    });
    return false;
  }

  this.keyFunctionPairs.splice(index, 1);
  return true;
};
_this.ApplyColumnsFunction = ApplyColumnsFunction;

export function MapcFunction(keyFunctionPairs, docstring) {
  // array of obj with [key, function]
  GenericFunction.call(this);
  this.name = 'mapc';
  this.displayName = 'mapc';
  var i;
  var kfPair;
  if (keyFunctionPairs !== null) {
    for (i = 0; i < keyFunctionPairs.length; ++i) {
      kfPair = keyFunctionPairs[i];
      if (kfPair !== null) {
        if (!(kfPair instanceof KeyFunctionPair) && kfPair.__type === 'KeyFunctionPair') {
          keyFunctionPairs[i] = KeyFunctionPair.revive(kfPair);
        }
      }
    }
  }

  if (!docstring) this.docstring = 'Map columns';
  else this.docstring = docstring;
  this.keyFunctionPairs = keyFunctionPairs;
  this.__type = 'MapcFunction';
};
MapcFunction.revive = function (data) {

  return new MapcFunction(data.keyFunctionPairs, data.docstring);
};
MapcFunction.prototype = Object.create(GenericFunction.prototype);
MapcFunction.prototype.generateClojure = function () {
  var i;
  var mkeyFunctionPairsClj = new jsedn.Map([]);
  var ackeyFunctionPairsClj = new jsedn.Map([]);
  for (i = 0; i < this.keyFunctionPairs.length; ++i) {
    //TODO: Group functions by type
    if (this.keyFunctionPairs[i].func.name === 'fill-when')
      ackeyFunctionPairsClj.set(
        new jsedn.kw(':' + this.keyFunctionPairs[i].key.value),
        new jsedn.sym(this.keyFunctionPairs[i].func.name)
      );
    else
      if (this.keyFunctionPairs[i].funcParams.length > 0) {
        var funcWithParams = [new jsedn.sym(this.keyFunctionPairs[i].func.name), new jsedn.sym('arg')];
        funcWithParams = funcWithParams.concat(this.keyFunctionPairs[i].funcParams);
        var mapcFunc = new jsedn.List([new jsedn.parse('fn [arg]'),
        new jsedn.List(funcWithParams)
        ]);
        mkeyFunctionPairsClj.set(
          new jsedn.kw(':' + this.keyFunctionPairs[i].key.value),
          mapcFunc);
      } else {
        mkeyFunctionPairsClj.set(
          new jsedn.kw(':' + this.keyFunctionPairs[i].key.value),
          new jsedn.sym(this.keyFunctionPairs[i].func.name)
        );
      }
  }

  var mapc;
  var applyc;
  if (mkeyFunctionPairsClj.keys.length !== 0)
    mapc = new jsedn.List([jsedn.sym('mapc'), mkeyFunctionPairsClj]);
  if (ackeyFunctionPairsClj.keys.length !== 0)
    applyc = new jsedn.List([jsedn.sym('apply-columns'), ackeyFunctionPairsClj]);
  if (mapc && !applyc) return mapc;
  if (!mapc && applyc) return applyc;
  if (mapc && applyc) return new jsedn.List([jsedn.sym('->'),
    mapc,
    applyc
  ]);
  else {
    Raven.captureMessage('Error parsing map in mapc', {
      tags: {
        file: 'transformationdatamodel',
        method: 'MapcFunction.generateClojure'
      }
    });
    return;
  }

};
MapcFunction.prototype.removeKeyFunctionPair = function (kfPair) {
  var index = this.keyFunctionPairs.indexOf(kfPair);
  if (index === -1 || kfPair === null || kfPair === undefined) {
    Raven.captureMessage('tried to remove non-existing function', {
      tags: {
        file: 'transformationdatamodel',
        method: 'MapcFunction.removeKeyFunctionPair'
      }
    });
    return false;
  }

  this.keyFunctionPairs.splice(index, 1);
  return true;
};
_this.MapcFunction = MapcFunction;

export function ColnameSorttype(colname, sorttype, order) {
  this.colname = colname;
  this.sorttype = sorttype;
  this.order = order;
  this.__type = 'ColnameSorttype';
};
ColnameSorttype.revive = function (data) {
  return new ColnameSorttype(data.colname, data.sorttype, data.order);
};
_this.ColnameSorttype = ColnameSorttype;

export function SortDatasetFunction(colnamesSorttypesMap, docstring) {
  // array of column names
  this.name = 'sort-dataset';
  this.displayName = 'sort-dataset';
  GenericFunction.call(this);
  var nametype;
  if (colnamesSorttypesMap !== null) {
    for (var i = 0; i < colnamesSorttypesMap.length; ++i) {
      nametype = colnamesSorttypesMap[i];
      if (nametype !== null) {
        if (!(nametype instanceof ColnameSorttype) && nametype.__type === 'ColnameSorttype') {
          colnamesSorttypesMap[i] = ColnameSorttype.revive(nametype);
        }
      }
    }
  }
  this.colnamesSorttypesMap = colnamesSorttypesMap;
  this.__type = 'SortDatasetFunction';
  if (!docstring) {
    this.docstring = 'Sort dataset';

  } else this.docstring = docstring;
};
SortDatasetFunction.revive = function (data) {
  return new SortDatasetFunction(data.colnamesSorttypesMap, data.docstring);
};
SortDatasetFunction.prototype = Object.create(GenericFunction.prototype);
SortDatasetFunction.prototype.generateClojure = function () {

  var values = new jsedn.Vector([]);
  var sort;
  for (var i = 0; i < this.colnamesSorttypesMap.length; ++i) {
    var newColnamesSorttypesMap = new jsedn.Map([]);
    sort = this.colnamesSorttypesMap[i].order ? 'desc' : 'asc';
    switch (this.colnamesSorttypesMap[i].sorttype) {
      case 'Alphabetical':
        sort += 'alpha';
        break;
      case 'Numerical':
        sort += 'num';
        break;
      case 'By length':
        sort += 'len';
        break;
      case 'Date':
        sort += 'date';
        break;
      default:
        sort = null;
    }

    newColnamesSorttypesMap.set(new jsedn.kw(':' + this.colnamesSorttypesMap[i].colname.value),
      new jsedn.kw(':' + sort));
    values.val.push(newColnamesSorttypesMap);
  }

  return new jsedn.List([jsedn.sym('new-tabular/sort-dataset'), values]);
};
SortDatasetFunction.prototype.removeColnameSorttype = function (nametype) {
  var index = this.colnamesSorttypesMap.indexOf(nametype);
  if (index === -1 || nametype === null || nametype === undefined) {
    Raven.captureMessage('tried to remove non-existing function', {
      tags: {
        file: 'transformationdatamodel',
        method: 'SortDatasetFunction.removeColnameSorttype'
      }
    });
    return false;
  }
  this.colnamesSorttypesMap.splice(index, 1);
  return true;
};
_this.SortDatasetFunction = SortDatasetFunction;

export function AddRowFunction(position, values, docstring) {
  this.name = 'add-row';
  this.displayName = 'add-row';
  GenericFunction.call(this);
  this.position = position;
  this.values = values;
  this.__type = 'AddRowFunction';
  if (!docstring)
    this.docstring = 'Add new row';
  else this.docstring = docstring;
};
AddRowFunction.revive = function (data) {
  return new AddRowFunction(data.position, data.values, data.docstring);
};
AddRowFunction.prototype = Object.create(GenericFunction.prototype);
AddRowFunction.prototype.generateClojure = function () {

  var values = new jsedn.Vector([]);
  for (var i = 0; i < this.values.length; ++i)
    values.val.push(this.values[i]);
  return new jsedn.List([jsedn.sym('new-tabular/add-row'), values]);
};
_this.AddRowFunction = AddRowFunction;

export function ShiftRowFunction(indexFrom, indexTo, shiftrowmode, docstring) {
  this.name = 'shift-row';
  this.displayName = 'shift-row';
  GenericFunction.call(this);
  this.indexFrom = indexFrom;
  this.indexTo = indexTo;
  this.shiftrowmode = shiftrowmode;
  this.__type = 'ShiftRowFunction';
  if (!docstring)
    this.docstring = 'Shift row number ' + indexFrom + (shiftrowmode === 'position') ? (' to position ' + indexTo) : ' to the end of the dataset';
  else this.docstring = docstring;
};
ShiftRowFunction.revive = function (data) {
  return new ShiftRowFunction(data.indexFrom, data.indexTo, data.shiftrowmode, data.docstring);
};
ShiftRowFunction.prototype = Object.create(GenericFunction.prototype);
ShiftRowFunction.prototype.generateClojure = function () {
  var values = [jsedn.sym('new-tabular/shift-row'), this.indexFrom];
  if (this.shiftrowmode === 'position') values.push(this.indexTo);
  return new jsedn.List(values);
};
_this.ShiftRowFunction = ShiftRowFunction;

export function ShiftColumnFunction(colFrom, indexTo, shiftcolmode, docstring) {
  this.name = 'shift-column';
  this.displayName = 'shift-column';
  GenericFunction.call(this);
  this.colFrom = colFrom;
  this.indexTo = indexTo;
  this.shiftcolmode = shiftcolmode;
  this.__type = 'ShiftColumnFunction';
  if (!docstring)
    this.docstring = 'Shift column ' + colFrom + (shiftcolmode === 'position') ? (' to index ' + indexTo) : ' to the rightmost position';
  else this.docstring = docstring;
};
ShiftColumnFunction.revive = function (data) {
  return new ShiftColumnFunction(data.colFrom, data.indexTo, data.shiftcolmode, data.docstring);
};
ShiftColumnFunction.prototype = Object.create(GenericFunction.prototype);
ShiftColumnFunction.prototype.generateClojure = function () {
  var values = [jsedn.sym('new-tabular/shift-column'), jsedn.kw(':' + this.colFrom.value)];
  if (this.shiftcolmode === 'position') values.push(this.indexTo);
  return new jsedn.List(values);
};
_this.ShiftColumnFunction = ShiftColumnFunction;

export function RemoveDuplicatesFunction(mode, colNames, separator, docstring) {
  // array of column names
  this.name = 'remove-duplicates';
  this.displayName = 'remove-duplicates';
  GenericFunction.call(this);
  this.mode = mode;
  this.colNames = colNames;
  this.separator = separator;
  this.__type = 'RemoveDuplicatesFunction';
  if (!docstring) {
    this.docstring = 'Remove duplicates';
  } else this.docstring = docstring;
};
RemoveDuplicatesFunction.revive = function (data) {
  return new RemoveDuplicatesFunction(data.mode, data.colNames, data.separator, data.docstring);
};
RemoveDuplicatesFunction.prototype = Object.create(GenericFunction.prototype);
RemoveDuplicatesFunction.prototype.generateClojure = function () {
  var values = [jsedn.sym('new-tabular/remove-duplicates')];
  if (this.mode !== 'full') {
    var colNamesClj = new jsedn.Vector([]);
    for (var i = 0; i < this.colNames.length; ++i) {
      colNamesClj.val.push(new jsedn.kw(':' + this.colNames[i].value));
    }

    values.push(colNamesClj);
  }
  /*if (this.mode === 'merge')
      values.push(this.separator);
  */
  return new jsedn.List(values);
};
_this.RemoveDuplicatesFunction = RemoveDuplicatesFunction;

export function MakeDatasetFunction(columnsArray, useLazy, numberOfColumns, moveFirstRowToHeader, docstring) {
  // array of column names
  this.name = 'make-dataset';
  this.displayName = 'make-dataset';
  GenericFunction.call(this);
  this.columnsArray = columnsArray;
  this.useLazy = useLazy;
  this.numberOfColumns = numberOfColumns;
  this.moveFirstRowToHeader = moveFirstRowToHeader;
  this.__type = 'MakeDatasetFunction';
  if (!docstring) {
    this.docstring = 'Make dataset';
    if (moveFirstRowToHeader) this.docstring += ', create header from the first row';
  } else this.docstring = docstring;
};
MakeDatasetFunction.revive = function (data) {
  // to revive those transformations that have been created before autocomplete in select
  var columnsArray = [];
  if (data.columnsArray.length > 0 && data.columnsArray[0] && !data.columnsArray[0].hasOwnProperty('id')) {
    for (var i = 0; i < data.columnsArray.length; ++i) {
      var colname = {
        id: i,
        value: data.columnsArray[i]
      };
      columnsArray.push(colname);
    }
  } else {
    columnsArray = data.columnsArray;
  }
  return new MakeDatasetFunction(columnsArray, data.useLazy, data.numberOfColumns, data.moveFirstRowToHeader);
};
MakeDatasetFunction.prototype = Object.create(GenericFunction.prototype);
MakeDatasetFunction.prototype.generateClojure = function () {
  //(make-dataset [:name :sex :age])
  var i;
  var colNamesClj = new jsedn.Vector([]);
  if (this.useLazy !== true) {
    if (this.moveFirstRowToHeader) {
      return new jsedn.List([
        jsedn.sym('->'),
        new jsedn.List([jsedn.sym('make-dataset'), jsedn.sym('move-first-row-to-header')]),
        new jsedn.List([jsedn.sym('rename-columns'),
        new jsedn.List([
          jsedn.sym('comp'),
          jsedn.sym('keyword'),
          jsedn.sym('new-tabular/string-as-keyword')
        ])
        ])
      ]);
    } else {
      if (this.columnsArray.length > 0) {
        for (i = 0; i < this.columnsArray.length; ++i) {
          colNamesClj.val.push(new jsedn.kw(':' + this.columnsArray[i].value));
        }

        return new jsedn.List([jsedn.sym('make-dataset'), colNamesClj]);
      } else return new jsedn.List([jsedn.sym('make-dataset')]);
    }
  } else {
    // make dataset with lazy naming
    return new jsedn.List([jsedn.sym('make-dataset'),
    new jsedn.List([jsedn.parse('into'), new jsedn.Vector([]),
    new jsedn.List([jsedn.sym('map'),
    jsedn.sym('keyword'),
    new jsedn.List([jsedn.sym('take'),
    parseInt(this.numberOfColumns),
    new jsedn.List([jsedn.sym('grafter.sequences/alphabetical-column-names')])
    ])
    ])
    ])
    ]);
  }
};
_this.MakeDatasetFunction = MakeDatasetFunction;

export function ColumnsFunction(columnsArray, indexFrom, indexTo, take, docstring) {
  // array of column names
  this.name = 'columns';
  this.displayName = (take ? 'columns' : 'remove-columns');
  GenericFunction.call(this);
  this.columnsArray = columnsArray;
  this.indexFrom = indexFrom;
  this.indexTo = indexTo;
  this.take = take;
  this.__type = 'ColumnsFunction';

  if (!docstring) {

    this.docstring = (take ? 'Narrow dataset to ' : 'Exclude columns ');
    if (indexFrom || indexTo) {
      this.docstring += ' columns ' + indexFrom + ' - ' + indexTo;
    } else {
      var i;
      this.docstring += (take ? ' columns:' : '');
      for (i = 0; i < columnsArray.length; ++i) {
        this.docstring += ' ' + columnsArray[i].value;
      }
    }

  } else this.docstring = docstring;
};
ColumnsFunction.revive = function (data) {
  var columnsArray = [];
  if (data.columnsArray.length > 0)
    if (!data.columnsArray[0].hasOwnProperty('id')) {
      for (var i = 0; i < data.columnsArray.length; ++i) {
        var colname = {
          id: i,
          value: data.columnsArray[i]
        };
        columnsArray.push(colname);
      }
    } else
      columnsArray = data.columnsArray;
  var indexFrom;
  var indexTo;
  if (data.hasOwnProperty('numberOfColumns')) {
    indexFrom = 0;
    indexTo = data.numberOfColumns;
  } else {
    indexFrom = data.indexFrom;
    indexTo = data.indexTo;
  }
  return new ColumnsFunction(columnsArray, indexFrom, indexTo, data.take, data.docstring);
};
ColumnsFunction.prototype = Object.create(GenericFunction.prototype);
ColumnsFunction.prototype.generateClojure = function () {

  var i;
  var colNamesClj = new jsedn.Vector([]);
  if (this.indexFrom === null || this.indexTo === null) {
    for (i = 0; i < this.columnsArray.length; ++i) {
      colNamesClj.val.push(new jsedn.kw(':' + this.columnsArray[i].value));
    }

    return new jsedn.List([jsedn.sym((this.take ? 'columns' : 'new-tabular/remove-columns')), colNamesClj]);
  } else {
    return this.take ? new jsedn.List([jsedn.sym('columns'),
    new jsedn.List([jsedn.sym('range'), parseInt(this.indexFrom), parseInt(this.indexTo + 1)])
    ]) :
      new jsedn.List([jsedn.sym('new-tabular/remove-columns'), parseInt(this.indexFrom), parseInt(this.indexTo)
      ]);
  }

};
_this.ColumnsFunction = ColumnsFunction;


export function FillRowsFunction(indexFrom, indexTo, docstring) {
  // array of column names
  this.name = 'fill-rows';
  this.displayName = 'fill-rows';
  GenericFunction.call(this);
  this.indexFrom = indexFrom;
  this.indexTo = indexTo;
  this.__type = 'FillRowsFunction';

  if (!docstring) {

    this.docstring = 'Fill rows ' + indexFrom + ' - ' + indexTo;


  } else this.docstring = docstring;
};
FillRowsFunction.revive = function (data) {

  return new FillRowsFunction(data.indexFrom, data.indexTo, data.docstring);

};
FillRowsFunction.prototype = Object.create(GenericFunction.prototype);
FillRowsFunction.prototype.generateClojure = function () {

  var fillRowsEdn = new jsedn.List([jsedn.sym('new-tabular/fill-row-when'), this.indexFrom]);

  if (this.indexFrom !== this.indexTo)
    fillRowsEdn.val.push(this.indexTo);
  return fillRowsEdn;

};
_this.FillRowsFunction = FillRowsFunction;

export function MergeRowsFunction(indexFrom, indexTo, separator, docstring) {
  // array of column names
  this.name = 'merge-rows';
  this.displayName = 'merge-rows';
  GenericFunction.call(this);
  this.indexFrom = indexFrom;
  this.indexTo = indexTo;
  this.separator = separator;
  this.__type = 'MergeRowsFunction';

  if (!docstring) {

    this.docstring = 'Merge rows ' + indexFrom + ' - ' + indexTo;


  } else this.docstring = docstring;
};
MergeRowsFunction.revive = function (data) {

  return new MergeRowsFunction(data.indexFrom, data.indexTo, data.separator, data.docstring);

};
MergeRowsFunction.prototype = Object.create(GenericFunction.prototype);
MergeRowsFunction.prototype.generateClojure = function () {




  return new jsedn.List([jsedn.sym('new-tabular/merge-rows'), this.indexFrom, this.indexTo, this.separator]);

};
_this.MergeRowsFunction = MergeRowsFunction;

var ChangeColtype = function (columnName, datatype) {
  this.name = 'changeColtype';
  this.displayName = 'change-type';
  GenericFunction.call(this);
  this.columnName = columnName;
  this.datatype = datatype;
  this.docstring = 'Change datatype of column ' + columnName + ' to ' + datatype;
}
_this.ChangeColtype = ChangeColtype;

export function MeltFunction(columnsArray, variable, value, aggrFunction, separator, docstring) {
  // array of column names
  this.name = 'melt';
  this.displayName = variable ? 'cast' : 'melt';
  GenericFunction.call(this);
  this.columnsArray = columnsArray;
  this.variable = variable;
  this.value = value;
  this.aggrFunction = aggrFunction;
  this.separator = separator;
  this.__type = 'MeltFunction';
  if (!docstring) {
    this.docstring = 'Reshape dataset';
  } else {
    this.docstring = docstring;
  }
};
MeltFunction.revive = function (data) {
  var variable, value, aggrFunction, separator;
  var columnsArray = [];
  if (data.columnsArray.length > 0 && !data.columnsArray[0].hasOwnProperty('id')) {
    for (var i = 0; i < data.columnsArray.length; ++i) {
      var colname = {
        id: i,
        value: data.columnsArray[i]
      };
      columnsArray.push(colname);
    }
  } else
    columnsArray = data.columnsArray;
  variable = data.hasOwnProperty('variable') ? data.variable : null;
  value = data.hasOwnProperty('value') ? data.value : null;
  aggrFunction = data.hasOwnProperty('aggrFunction') ? data.aggrFunction : null;
  separator = data.hasOwnProperty('separator') ? data.separator : null;
  return new MeltFunction(columnsArray, variable, value, aggrFunction, separator, data.docstring);
};
MeltFunction.prototype = Object.create(GenericFunction.prototype);
MeltFunction.prototype.generateClojure = function () {
  var i;
  var returnValue;
  if (this.columnsArray.length > 0) {
    var colNamesClj = new jsedn.Vector([]);
    for (i = 0; i < this.columnsArray.length; ++i) {
      colNamesClj.val.push(new jsedn.kw(':' + this.columnsArray[i].value));
    }
    // returnValue = new jsedn.List([jsedn.sym('melt'), colNamesClj]);
    returnValue = new jsedn.List([jsedn.sym('->'), new jsedn.List([jsedn.sym('melt'), colNamesClj]), new jsedn.List([jsedn.sym('mapc'), new jsedn.Map([jsedn.kw(':variable'), jsedn.sym('name')])])]);
  } else {

    returnValue = new jsedn.List([jsedn.sym('new-tabular/cast'), jsedn.kw(':' + this.variable.value), jsedn.kw(':' + this.value.value), this.separator ? this.separator : this.aggrFunction]);
  }
  return returnValue;
};
_this.MeltFunction = MeltFunction;

export function Pipeline(functions) {
  // functions that make up the pipeline
  // TODO: revive!
  var funct;
  var i;
  for (i = 0; i < functions.length; ++i) {
    funct = functions[i];
    if (!(funct instanceof GenericFunction)) {
      if (funct.__type === 'DropRowsFunction') {
        functions[i] = DropRowsFunction.revive(funct);
      }

      if (funct.__type === 'UtilityFunction') {
        functions[i] = UtilityFunction.revive(funct);
      }

      if (funct.__type === 'AddColumnsFunction') {
        functions[i] = AddColumnsFunction.revive(funct);
      }
      if (funct.__type === 'SortDatasetFunction') {
        functions[i] = SortDatasetFunction.revive(funct);
      }

      if (funct.__type === 'AddRowFunction') {
        functions[i] = AddRowFunction.revive(funct);
      }
      if (funct.__type === 'ShiftRowFunction') {
        functions[i] = ShiftRowFunction.revive(funct);
      }
      if (funct.__type === 'ShiftColumnFunction') {
        functions[i] = ShiftColumnFunction.revive(funct);
      }
      if (funct.__type === 'GroupRowsFunction') {
        functions[i] = GroupRowsFunction.revive(funct);
      }
      if (funct.__type === 'MergeColumnsFunction') {
        functions[i] = MergeColumnsFunction.revive(funct);
      }
      if (funct.__type === 'AddColumnFunction') {
        functions[i] = AddColumnFunction.revive(funct);
      }

      if (funct.__type === 'DeriveColumnFunction') {
        functions[i] = DeriveColumnFunction.revive(funct);
      }

      if (funct.__type === 'RenameColumnsFunction') {
        functions[i] = RenameColumnsFunction.revive(funct);
      }

      if (funct.__type === 'MapcFunction') {
        functions[i] = MapcFunction.revive(funct);
      }

      if (funct.__type === 'ApplyColumnsFunction') {
        functions[i] = ApplyColumnsFunction.revive(funct);
      }

      if (funct.__type === 'MakeDatasetFunction') {
        functions[i] = MakeDatasetFunction.revive(funct);
      }

      if (funct.__type === 'RemoveDuplicatesFunction') {
        functions[i] = RemoveDuplicatesFunction.revive(funct);
      }

      if (funct.__type === 'ColumnsFunction') {
        functions[i] = ColumnsFunction.revive(funct);
      }

      if (funct.__type === 'MeltFunction') {
        functions[i] = MeltFunction.revive(funct);
      }

      if (funct.__type === 'GrepFunction') {
        functions[i] = GrepFunction.revive(funct);
      }

      if (funct.__type === 'SplitFunction') {
        functions[i] = SplitFunction.revive(funct);
      }
    }
  }

  this.functions = functions;
  this.__type = 'Pipeline';
};
Pipeline.revive = function (data) {
  return new Pipeline(data.functions);
};
Pipeline.prototype.addAfter = function (funct, functionToAdd) {
  var index = this.functions.indexOf(funct);
  if (!functionToAdd || index === -1) {
    this.functions.push(functionToAdd);
  } else {
    if (index === this.functions.length - 1) {
      this.functions.push(functionToAdd);
      return true;
    } else {
      return this.functions.splice(index + 1, 0, functionToAdd);
    }
  }
};
Pipeline.prototype.remove = function (funct) {
  var index = this.functions.indexOf(funct);
  if (index === -1 || funct === null || funct === undefined) {
    /*     Raven.captureMessage('tried to remove non-existing function', {
          tags: {
            file: 'transformationdatamodel',
            method: 'Pipeline.remove'
          }
        }); */
    return false;
  }

  this.functions.splice(index, 1);
  return true;
};
_this.Pipeline = Pipeline;

export function getGraphElement(inputElement) {
  if (!(inputElement instanceof RDFElement)) {
    return _this[inputElement.__type].revive(inputElement);
  } else {
    return inputElement;
  }
};

// TODO remove subElements and move to URINode (which are the only elements that can have subelements)
export function RDFElement(subElements) {
  var i;
  var resolvedSubElements;
  resolvedSubElements = [];
  if (subElements) {
    for (i = 0; i < subElements.length; ++i) {
      resolvedSubElements.push(getGraphElement(subElements[i]));
    }
  }

  this.subElements = resolvedSubElements;
};

export function URINode(prefix, subElements) {
  RDFElement.call(this, subElements);
  this.prefix = prefix;
};
URINode.prototype = Object.create(RDFElement.prototype);
URINode.revive = function (data) {
  return new URINode(data.prefix, data.subElements);
};
URINode.prototype.addChild = function (child) {
  this.subElements.push(child);
};
URINode.prototype.addNodeAfter = function (property, propertyToAdd) {
  var index = this.subElements.indexOf(property);
  if (!property || index === -1) {
    this.subElements.push(propertyToAdd);
  } else {
    if (index === this.subElements.length - 1) {
      this.subElements.push(propertyToAdd);
      return true;
    } else {
      this.subElements.splice(index + 1, 0, propertyToAdd);
      return true;
    }
  }

  return false;
};
URINode.prototype.removeChild = function (child) {
  var childIndex = this.subElements.indexOf(child);
  if (childIndex !== -1) {
    this.subElements.splice(childIndex, 1);
  }
  return childIndex;
};
URINode.prototype.replaceChild = function (child, nodeToReplaceWith) {
  var childIndex = this.subElements.indexOf(child);
  if (childIndex !== -1) {
    this.subElements.splice(childIndex, 1, nodeToReplaceWith);
  }
  return childIndex;
};
_this.URINode = URINode;

export function ConstantURI(prefix, constantURIText, nodeCondition, subElements) {
  URINode.call(this, prefix, subElements);
  this.constant = constantURIText;
  this.nodeCondition = nodeCondition;
  this.__type = 'ConstantURI';
};
ConstantURI.prototype = Object.create(URINode.prototype);
ConstantURI.revive = function (data) {
  var conditions = [];
  if (data.hasOwnProperty('nodeCondition')) {
    if (data.nodeCondition.constructor === Array && data.nodeCondition.length > 0) {
      for (var i = 0; i < data.nodeCondition.length; ++i) {
        conditions.push(Condition.revive(data.nodeCondition[i]));
      }
    }
  }
  return new ConstantURI(data.prefix, data.constant, conditions, data.subElements);
};
_this.ConstantURI = ConstantURI;

export function ColumnURI(prefix, columnName, nodeCondition, subElements) {
  URINode.call(this, typeof prefix === 'object' ? prefix.value : prefix, subElements);
  this.column = columnName;
  this.nodeCondition = nodeCondition;
  this.__type = 'ColumnURI';
};
ColumnURI.prototype = Object.create(URINode.prototype);
ColumnURI.revive = function (data) {

  var colname, prefix;
  if (data.column.hasOwnProperty('id')) colname = data.column;
  else colname = {
    id: 0,
    value: data.column
  };
  if (data.prefix.hasOwnProperty('id')) prefix = data.prefix;
  else prefix = {
    id: 0,
    value: data.prefix
  };
  var conditions = [];
  if (data.hasOwnProperty('nodeCondition')) {
    if (data.nodeCondition.constructor === Array && data.nodeCondition.length > 0) {
      for (var i = 0; i < data.nodeCondition.length; ++i) {
        conditions.push(Condition.revive(data.nodeCondition[i]));
      }
    }
  }
  return new ColumnURI(prefix, colname, conditions, data.subElements);
};
_this.ColumnURI = ColumnURI;

export function Condition(column, operator, operand, conj) {
  this.column = column;
  this.operator = operator;
  this.operand = operand;
  this.conj = conj;
  this.__type = 'Condition';
};
Condition.revive = function (data) {
  return new Condition(data.column, data.operator, data.operand, data.conj);
};
_this.Condition = Condition;

export function Property(prefix, propertyName, propertyCondition, subElements) {
  RDFElement.call(this, subElements);
  this.prefix = prefix;
  this.propertyName = propertyName;
  this.propertyCondition = propertyCondition;
  this.__type = 'Property';
};
Property.prototype = Object.create(RDFElement.prototype);
Property.prototype.removeChild = function (child) {
  var childIndex = this.subElements.indexOf(child);
  if (childIndex !== -1) {
    this.subElements.splice(childIndex, 1);
  }
  return childIndex;
};
Property.prototype.addNodeAfter = function (node, nodeToAdd) {
  var index = this.subElements.indexOf(node);
  if (!node || index === -1) {
    this.subElements.push(nodeToAdd);
    return true;
  }

  if (index === this.subElements.length - 1) {
    this.subElements.push(nodeToAdd);
    return true;
  }

  return this.subElements.splice(index + 1, 0, nodeToAdd);
};
Property.prototype.addChild = function (child) {
  this.subElements.push(child);
};
Property.prototype.replaceChild = function (child, nodeToReplaceWith) {
  var childIndex = this.subElements.indexOf(child);
  if (childIndex !== -1) {
    this.subElements.splice(childIndex, 1, nodeToReplaceWith);
  }
  return childIndex;
};
Property.revive = function (data) {

  var conditions = [];
  if (data.hasOwnProperty('propertyCondition')) {
    if (data.propertyCondition.constructor === Array && data.propertyCondition.length > 0) {
      for (var i = 0; i < data.propertyCondition.length; ++i) {
        conditions.push(Condition.revive(data.propertyCondition[i]));
      }
    } else {

      if (data.propertyCondition.length !== 0 && data.propertyCondition !== "") {

        conditions.push(new Condition(null, {
          "id": 6,
          "name": "Custom code"
        }, data.propertyCondition.toString(), null));
      }
    }
  }

  return new Property(data.prefix, data.propertyName, conditions, data.subElements);
};
_this.Property = Property;

export function ColumnLiteral(literalText, datatype, onEmpty, onError, langTag, datatypeURI, nodeCondition) {
  RDFElement.call(this, []);
  this.literalValue = literalText;
  this.datatype = datatype;
  this.onEmpty = onEmpty;
  this.onError = onError;
  this.langTag = langTag;
  this.datatypeURI = datatypeURI;
  this.nodeCondition = nodeCondition;
  this.__type = 'ColumnLiteral';
};
ColumnLiteral.prototype = Object.create(RDFElement.prototype);
ColumnLiteral.revive = function (data) {
  var colname;
  if (data.literalValue.hasOwnProperty('id')) colname = data.literalValue;
  else colname = {
    id: 0,
    value: data.literalValue
  };
  var datatype = data.hasOwnProperty('datatype') ? data.datatype : {
    name: 'unspecified',
    id: 0
  };
  var onEmpty = data.hasOwnProperty('onEmpty') ? data.onEmpty : null;
  var onError = data.hasOwnProperty('onError') ? data.onError : null;
  var langTag = data.hasOwnProperty('langTag') ? data.langTag : null;
  var datatypeURI = data.hasOwnProperty('datatypeURI') ? data.datatypeURI : null;
  var conditions = [];
  if (data.hasOwnProperty('nodeCondition')) {
    if (data.nodeCondition.constructor === Array && data.nodeCondition.length > 0) {
      for (var i = 0; i < data.nodeCondition.length; ++i) {
        conditions.push(Condition.revive(data.nodeCondition[i]));
      }
    }
  }
  return new ColumnLiteral(colname, datatype, onEmpty, onError, langTag, datatypeURI, conditions);

};
_this.ColumnLiteral = ColumnLiteral;

export function ConstantLiteral(literalText, nodeCondition) {
  RDFElement.call(this, []);
  this.literalValue = literalText;
  this.nodeCondition = nodeCondition;
  this.__type = 'ConstantLiteral';
};
ConstantLiteral.prototype = Object.create(RDFElement.prototype);
ConstantLiteral.revive = function (data) {
  var conditions = [];
  if (data.hasOwnProperty('nodeCondition')) {
    if (data.nodeCondition.constructor === Array && data.nodeCondition.length > 0) {
      for (var i = 0; i < data.nodeCondition.length; ++i) {
        conditions.push(Condition.revive(data.nodeCondition[i]));
      }
    }
  }
  return new ConstantLiteral(data.literalValue, conditions);
};
_this.ConstantLiteral = ConstantLiteral;

// TODO add support for blank nodes
export function BlankNode(nodeCondition, subElements) {
  RDFElement.call(this, subElements);
  this.nodeCondition = nodeCondition;
  this.__type = 'BlankNode';
};
BlankNode.prototype = Object.create(URINode.prototype);
BlankNode.revive = function (data) {
  var conditions = [];
  if (data.hasOwnProperty('nodeCondition')) {
    if (data.nodeCondition.constructor === Array && data.nodeCondition.length > 0) {
      for (var i = 0; i < data.nodeCondition.length; ++i) {
        conditions.push(Condition.revive(data.nodeCondition[i]));
      }
    }
  }
  return new BlankNode(conditions, data.subElements);
};
_this.BlankNode = BlankNode;

export function RDFVocabulary(prefixName, namespaceURI, properties, classes) {
  this.name = prefixName;
  this.namespace = namespaceURI;
  this.properties = properties;
  this.classes = classes;
  this.fromServer = false;

  this.__type = 'RDFVocabulary';
};
RDFVocabulary.revive = function (data) {
  return new RDFVocabulary(data.name, data.namespace, data.properties, data.classes);
};
_this.RDFVocabulary = RDFVocabulary;

export function Graph(graphURI, existingGraphRoots) {
  var i;
  var graphRootsToAdd;

  graphRootsToAdd = [];

  // just a string
  this.graphURI = graphURI;

  // need to get stringifiable roots first
  for (i = 0; i < existingGraphRoots.length; ++i) {
    graphRootsToAdd.push(getGraphElement(existingGraphRoots[i]));
  }

  this.graphRoots = graphRootsToAdd;
  this.__type = 'Graph';
};
Graph.prototype.addChild = function (child) {
  this.graphRoots.push(child);

};
Graph.prototype.replaceChild = function (child, nodeToReplaceWith) {
  var childIndex = this.graphRoots.indexOf(child);
  if (childIndex !== -1) {
    this.graphRoots.splice(childIndex, 1, nodeToReplaceWith);
  }
  return childIndex;
};
Graph.prototype.removeChild = function (child) {
  var childIndex = this.graphRoots.indexOf(child);
  if (childIndex !== -1) {
    this.graphRoots.splice(childIndex, 1);
  }
  return childIndex;
};
Graph.prototype.addNodeAfter = function (root, rootToAdd) {
  var index = this.graphRoots.indexOf(root);
  if (!root || index === -1) {
    this.graphRoots.push(rootToAdd);
    return true;
  }

  if (index === this.graphRoots.length - 1) {
    this.graphRoots.push(rootToAdd);
    return true;
  }

  return this.graphRoots.splice(index + 1, 0, rootToAdd);
};
Graph.revive = function (data) {
  return new Graph(data.graphURI, data.graphRoots);
};
_this.Graph = Graph;

export function Transformation(customFunctionDeclarations, prefixers, pipelines, graphs, rdfVocabs) {

  // validate that inputs are revived
  var i, cfd, prefixer, pipeline, graph, rdfVocab;
  if (!customFunctionDeclarations)
    customFunctionDeclarations = [];
  if (!prefixers)
    prefixers = [];
  if (!pipelines)
    pipelines = [];
  if (!graphs)
    graphs = [];
  if (!rdfVocabs)
    rdfVocabs = [];

  for (i = 0; i < customFunctionDeclarations.length; ++i) {
    cfd = customFunctionDeclarations[i];
    if (!(cfd instanceof CustomFunctionDeclaration) && cfd.__type === 'CustomFunctionDeclaration') {
      // TODO: validate, above doesn't check for null
      customFunctionDeclarations[i] = CustomFunctionDeclaration.revive(cfd);
    }
  }

  for (i = 0; i < prefixers.length; ++i) {
    prefixer = prefixers[i];
    if (!(prefixer instanceof Prefixer) && prefixer.__type === 'Prefixer') {
      // TODO: validate
      prefixers[i] = Prefixer.revive(prefixer);
    }
  }

  for (i = 0; i < pipelines.length; ++i) {
    pipeline = pipelines[i];
    if (!(pipeline instanceof Pipeline) && pipeline.__type === 'Pipeline') {
      // TODO: validate
      pipelines[i] = Pipeline.revive(pipeline);
    }
  }

  for (i = 0; i < graphs.length; ++i) {
    graph = graphs[i];
    if (!(graph instanceof Graph) && graph.__type === 'Graph') {
      graphs[i] = Graph.revive(graphs[i]);
    }
  }

  for (i = 0; i < rdfVocabs.length; ++i) {
    rdfVocab = rdfVocabs[i];
    if (!(rdfVocab instanceof RDFVocabulary) && rdfVocab.__type === 'RDFVocabulary') {
      rdfVocabs[i] = RDFVocabulary.revive(rdfVocabs[i]);
    }
  }

  this.customFunctionDeclarations = customFunctionDeclarations;
  this.prefixers = prefixers;
  this.pipelines = pipelines;
  this.graphs = graphs;
  this.rdfVocabs = rdfVocabs; //TODO fill this
  this.__type = 'Transformation';

};
Transformation.revive = function (data) {
  var pipelines = [];
  for (var a = 0; a < data.pipelines.length; ++a) {
    var currPipeline = data.pipelines[a];
    var functions = [];
    for (var i = 0; i < data.pipelines[a].functions.length; ++i) {
      var currFunct = data.pipelines[a].functions[i];
      if (currFunct.__type === 'MapcFunction') {
        for (var j = 0; j < currFunct.keyFunctionPairs.length; ++j) {
          if (!currFunct.keyFunctionPairs[j].func.hasOwnProperty('name')) {
            for (var k = 0; k < data.customFunctionDeclarations.length; ++k) {
              if (data.customFunctionDeclarations[k].name === currFunct.keyFunctionPairs[j].func) {
                currFunct.keyFunctionPairs[j].func = {
                  name: data.customFunctionDeclarations[k].name,
                  group: data.customFunctionDeclarations[k].group,
                  id: 0
                };
              }
            }

            for (var k = 0; k < data.prefixers.length; ++k) {
              if (data.prefixers[k].name === currFunct.keyFunctionPairs[j].func) {
                currFunct.keyFunctionPairs[j].func = {
                  name: data.prefixers[k].name,
                  group: 'PREFIXERS',
                  id: 0
                };
              }
            }
          }
        }
        functions.push(currFunct);
      } else
        functions.push(currFunct);
    }
    currPipeline.functions = functions;
    pipelines.push(currPipeline);
  }
  var transformation = new Transformation(data.customFunctionDeclarations, data.prefixers, pipelines, data.graphs, data.rdfVocabs);
  // Utilities for ASIA
  if (data.annotations) { // TODO: remove this member function when ASIA will be fully compatible with the Graph model
    transformation.setAnnotations(data.annotations);
  }
  if (data.reconciledColumns) {
    transformation.setReconciledColumns(data.reconciledColumns);
  }
  return transformation;
};
// Utilities for ASIA
// TODO: remove this member function when ASIA will be fully compatible with the Graph model
Transformation.prototype.setAnnotations = function (annotations) {
  this.annotations = annotations;
};
Transformation.prototype.setReconciledColumns = function (reconciledColumns) {
  this.reconciledColumns = reconciledColumns;
};
Transformation.prototype.addGraphAfter = function (graph, graphToAdd) {

  var index = this.graphs.indexOf(graph);
  if (!graph || index === -1) {
    this.graphs.push(graphToAdd);
  } else {
    if (index === this.graphs.length - 1) {
      this.graphs.push(graphToAdd);
      return true;
    } else {
      return this.graphs.splice(index + 1, 0, graphToAdd);
    }
  }
};
Transformation.prototype.addPrefixer = function (name, uri, parentPrefix) {
  for (var i = 0; i < this.prefixers.length; ++i) {
    if (this.prefixers[i].name === name.trim()) {
      return false;
    }
  }

  this.prefixers.push(new Prefixer(name.trim(), uri.trim(), parentPrefix.trim()));
  return true;
};
Transformation.prototype.removePrefixer = function (name) {
  for (var i = 0; i < this.prefixers.length; ++i) {
    if (this.prefixers[i].name === name.trim()) {
      this.prefixers.splice(i, 1);
      return true;
    }
  }

  return false;
};
Transformation.prototype.addCustomFunctionDeclaration = function (name, clojureCode, group, docstring) {
  for (var i = 0; i < this.customFunctionDeclarations.length; ++i) {
    if (this.customFunctionDeclarations[i].name === name.trim()) {
      this.customFunctionDeclarations[i].clojureCode = clojureCode;
      return false;
    }
  }

  this.customFunctionDeclarations.push(new CustomFunctionDeclaration(name, clojureCode, group, docstring));
  return true;
};
Transformation.prototype.removeCustomFunctionDeclaration = function (customFunct) {
  for (var i = 0; i < this.customFunctionDeclarations.length; ++i) {
    if (this.customFunctionDeclarations[i].name === customFunct.name.trim()) {
      this.customFunctionDeclarations.splice(i, 1);
      return true;
    }
  }
  return false;
};
Transformation.prototype.getCustomFunctionDeclarations = function () {
  return this.customFunctionDeclarations;
};
Transformation.prototype.findPrefixerOrCustomFunctionByName = function (name) {
  var i;
  for (i = 0; i < this.prefixers.length; ++i) {
    if (this.prefixers[i].name === name) {
      return this.prefixers[i];
    }
  }

  for (i = 0; i < this.customFunctionDeclarations.length; ++i) {
    if (this.customFunctionDeclarations[i].name === name) {
      return this.customFunctionDeclarations[i];
    }
  }

  return null;
};
Transformation.prototype.getColumnKeysFromGraphNodes = function () {
  var requestedColumnKeys = [];
  var rootNode;
  for (var j = 0; j < this.graphs.length; ++j)
    for (var i = 0; i < this.graphs[j].graphRoots.length; ++i) {
      rootNode = this.graphs[j].graphRoots[i];
      if (rootNode instanceof ColumnURI) {
        // Support for 'legacy' transformations where, instead of strings, columns are objects (for whatever reason....)
        if (typeof rootNode.column === 'object') {
          if (requestedColumnKeys.indexOf(rootNode.column.value) === -1) {
            requestedColumnKeys.push(rootNode.column.value);
          }
        } else if (typeof rootNode.column === 'string') {
          if (requestedColumnKeys.indexOf(rootNode.column) === -1) {
            requestedColumnKeys.push(rootNode.column);
          }
        }
      }
      if (rootNode instanceof ColumnLiteral) {
        // Support for 'legacy' transformations where, instead of strings, columns are objects (for whatever reason....)
        if (typeof rootNode.column === 'object') {
          if (requestedColumnKeys.indexOf(rootNode.literalValue.value) === -1) {
            requestedColumnKeys.push(rootNode.literalValue.value);
          }
        } else if (typeof rootNode.column === 'string') {
          if (requestedColumnKeys.indexOf(rootNode.literalValue) === -1) {
            requestedColumnKeys.push(rootNode.literalValue);
          }
        }
      }
      for (var k = 0; k < rootNode.nodeCondition.length; ++k) {
        // Support for 'legacy' transformations where, instead of strings, columns are objects (for whatever reason....)
        if (typeof rootNode.nodeCondition[k].column === 'object') {
          if (requestedColumnKeys.indexOf(rootNode.nodeCondition[k].column.value) === -1) {
            requestedColumnKeys.push(rootNode.nodeCondition[k].column.value);
          }
        } else if (typeof rootNode.nodeCondition[k].column === 'string') {
          if (requestedColumnKeys.indexOf(rootNode.nodeCondition[k].column) === -1) {
            requestedColumnKeys.push(rootNode.nodeCondition[k].column);
          }
        }
      }
      requestedColumnKeys = getKeysFromSubs(rootNode, requestedColumnKeys);
    }

  return requestedColumnKeys;
};
Transformation.prototype.getColumnKeysFromPipeline = function () {
  var i;
  var j;
  var k;
  var currentFunction;
  var availableColumnKeys = [];

  for (j = 0; j < this.pipelines.length; ++j) {
    for (i = 0; i < this.pipelines[j].functions.length; ++i) {
      currentFunction = this.pipelines[j].functions[i];
      if (currentFunction instanceof DeriveColumnFunction) {
        availableColumnKeys.push(currentFunction.newColName);
      }

      if (currentFunction instanceof AddColumnsFunction) {
        for (k = 0; k < currentFunction.columnsArray.length; ++k)
          availableColumnKeys.push(currentFunction.columnsArray[k].colName);
      }

      if (currentFunction instanceof MeltFunction) {
        availableColumnKeys.push('variable');
        availableColumnKeys.push('value');
      }

      //TODO: clean and get new availColKeys for RenameColumns

      if (currentFunction instanceof MakeDatasetFunction) {
        if (!currentFunction.useLazy)
          for (k = 0; k < currentFunction.columnsArray.length; ++k) {
            availableColumnKeys.push(currentFunction.columnsArray[k].value);
          }

        // else //TODO:For lazy naming + for "move-first-row-to-header"

      }

      if (currentFunction instanceof ColumnsFunction) {
        for (k = 0; k < currentFunction.columnsArray.length; ++k) {
          availableColumnKeys.push(currentFunction.columnsArray[k].value);
        }

      }
    }
  }

  return availableColumnKeys;

};
Transformation.prototype.getPartialTransformation = function (untilFunction) {
  // TODO report errors?
  // TODO how to support multi-pipe transformation??
  try {
    if (!untilFunction) {
      //        console.log("Unable to compute partial transformation: empty until function");
      return this;
    }
    if (!(untilFunction instanceof GenericFunction)) {
      //        console.log("Unable to compute partial transformation: wrong type of input parameter");
      return this;
    }

    var index = this.pipelines[0].functions.indexOf(untilFunction);
    if (index === -1) {
      //        console.error("Unable to compute partial transformation: unable to find until function");
      return this;
    }

    var partialPipelineFunctions = this.pipelines[0].functions.slice(0, index + 1);

    var partialPipeline = new Pipeline(partialPipelineFunctions);

    var partialTransformation = new Transformation(this.customFunctionDeclarations, this.prefixers, [partialPipeline], [ /* no graphs needed for this */], this.rdfVocabs);

    return partialTransformation;
  } catch (e) {
    console.log('Unable to compute partial transformation: unknown error', e);
    return this;
  }
};
_this.Transformation = Transformation;

// TODO should this just be a prototype function of every RDFElement?
export function getKeysFromSubs(node, columnKeys) {
  for (var i = 0; i < node.subElements.length; ++i) {
    if (node.subElements[i] instanceof ColumnURI) {
      if (typeof node.subElements[i].column === 'object') {
        if (columnKeys.indexOf(node.subElements[i].column.value) === -1) {
          columnKeys.push(node.subElements[i].column.value);
        }
      } else if (typeof node.subElements[i].column === 'string') {
        if (columnKeys.indexOf(node.subElements[i].column) === -1) {
          columnKeys.push(node.subElements[i].column);
        }
      }
    }
    if (node.subElements[i] instanceof ColumnLiteral) {
      if (typeof node.subElements[i].literalValue === 'object') {
        if (columnKeys.indexOf(node.subElements[i].literalValue.value) === -1) {
          columnKeys.push(node.subElements[i].literalValue.value);
        }
      } else if (typeof node.subElements[i].literalValue === 'string') {
        if (columnKeys.indexOf(node.subElements[i].literalValue) === -1) {
          columnKeys.push(node.subElements[i].literalValue);
        }
      }
    }

    if (node.subElements[i] instanceof Property) {
      for (var j = 0; j < node.subElements[i].propertyCondition.length; ++j) {
        if (typeof node.subElements[i].propertyCondition[j].column === 'object') {
          if (node.subElements[i].propertyCondition[j].column && columnKeys.indexOf(node.subElements[i].propertyCondition[j].column.value) === -1) {
            columnKeys.push(node.subElements[i].propertyCondition[j].column.value);
          }
        } else if (typeof node.subElements[i].propertyCondition[j].column === 'string') {
          if (columnKeys.indexOf(node.subElements[i].propertyCondition[j].column) === -1) {
            columnKeys.push(node.subElements[i].propertyCondition[j].column);
          }
        }
      }
    }
    if (node.subElements[i].__type !== "Property") {
      for (var j = 0; j < node.subElements[i].nodeCondition.length; ++j) {
        if (typeof node.subElements[i].nodeCondition[j].column === 'object') {
          if (columnKeys.indexOf(node.subElements[i].nodeCondition[j].column.value) === -1) {
            columnKeys.push(node.subElements[i].nodeCondition[j].column.value);
          }
        } else if (typeof node.subElements[i].nodeCondition[j].column === 'string') {
          if (columnKeys.indexOf(node.subElements[i].nodeCondition[j].column) === -1) {
            columnKeys.push(node.subElements[i].nodeCondition[j].column);
          }
        }
      }
    }
    getKeysFromSubs(node.subElements[i], columnKeys);
  }

  return columnKeys;
}

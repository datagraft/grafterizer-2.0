import { Injectable } from '@angular/core';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
@Injectable()
export class TransformationUpdaterService {
  private allCustomFunctions;
  constructor() {
    let customfunctions = [
      new transformationDataModel.CustomFunctionDeclaration(
        'replace-varible-string',
        '(defn replace-varible-string [cell]   (-> cell  (clojure.string/replace (read-string "#\\".* #\\"") "number") (clojure.string/replace (read-string "#\\"[0-9]{4} \\"") "") ))',
        'SERVICE', ''),
      new transformationDataModel.CustomFunctionDeclaration(
        'organize-date',
        '(defn organize-date "Transform date dd/mm/yyyy ~> yyyy-mm-dd" [date] (when (seq date)  (let [[d m y] (clojure.string/split date  (read-string "#\\"/\\""))]  (apply str (interpose "-" [y m d])))))',
        'DATE FUNCTIONS', 'Transform date dd/mm/yyyy ~> yyyy-mm-dd'),
      new transformationDataModel.CustomFunctionDeclaration(
        'double-literal',
        '(defn double-literal [s] (if (nil? (re-matches #"[0-9.]+" s)) 0 (Double/parseDouble s)))',
        'CONVERT DATATYPE', 'Coerce to double. Null and non-valid values are replaced with zero'),
      new transformationDataModel.CustomFunctionDeclaration(
        'integer-literal',
        '(defn integer-literal [s] (if (nil? (re-matches #"[0-9.]+" s)) 0 (Integer/parseInt s)))',
        'CONVERT DATATYPE', 'Coerce to integer. Null and non-valid values are replaced with zero'),
      new transformationDataModel.CustomFunctionDeclaration(
        'transform-gender',
        '(def transform-gender {"f" (s "female") "m" (s "male")})', 'UTILITY',
        'Maps "f" to "female" and "m" to "male"'),
      new transformationDataModel.CustomFunctionDeclaration(
        'stringToNumeric',
        '(defn stringToNumeric    [x] (if (= "" x) nil  (if (.contains x ".") (Double/parseDouble x)(Integer/parseInt x))))',
        'CONVERT DATATYPE', 'Convert string to numeric'),
      new transformationDataModel.CustomFunctionDeclaration(
        'string-literal',
        '(def string-literal s)',
        'CONVERT DATATYPE', 'Coerce to string'),
      new transformationDataModel.CustomFunctionDeclaration('boolean', '', 'CONVERT DATATYPE', 'Coerce to boolean'),
      new transformationDataModel.CustomFunctionDeclaration('count', '', 'COLLECTION', 'Returns the number of items in the collection'),
      new transformationDataModel.CustomFunctionDeclaration('cast', '', 'CONVERT DATATYPE', ' Throws a ClassCastException if x is not a c, else returns x'),
      new transformationDataModel.CustomFunctionDeclaration('capitalize', '', 'STRING', 'Converts first character of the string to upper-case, all other characters to lower-case.'),
      new transformationDataModel.CustomFunctionDeclaration('dec', '', 'NUMBER', 'Returns a number one less than num'),
      new transformationDataModel.CustomFunctionDeclaration('double', '', 'CONVERT DATATYPE', 'Coerce to double'),
      new transformationDataModel.CustomFunctionDeclaration('first', '', 'COLLECTION', 'Returns the first item in the collection'),
      new transformationDataModel.CustomFunctionDeclaration('float', '', 'CONVERT DATATYPE', 'Coerce to float'),
      new transformationDataModel.CustomFunctionDeclaration('inc', '', 'NUMBER', 'Returns a number one greater than num'),
      new transformationDataModel.CustomFunctionDeclaration('keyword', '', 'CONVERT DATATYPE', 'Returns a Keyword with the given namespace and name. '),
      new transformationDataModel.CustomFunctionDeclaration('last', '', 'COLLECTION', 'Return the last item in the collection'),
      new transformationDataModel.CustomFunctionDeclaration('long', '', 'CONVERT DATATYPE', 'Coerce to long'),
      new transformationDataModel.CustomFunctionDeclaration('name', '', 'CONVERT DATATYPE', 'Returns the name String of a string, symbol or keyword'),
      new transformationDataModel.CustomFunctionDeclaration('second', '', 'COLLECTION', 'Returns the second item in the collection'),
      new transformationDataModel.CustomFunctionDeclaration('short', '', 'CONVERT DATATYPE', 'Coerce to short'),
      new transformationDataModel.CustomFunctionDeclaration(
        'join',
        '(defn join [& strings] (clojure.string/join " " strings))',
        'STRING', 'Returns a string of all elements in the collection separated by space.'),
      new transformationDataModel.CustomFunctionDeclaration(
        'join-with',
        '(defn join-with [sep] ( fn [& strings] (clojure.string/join sep strings)))',
        'STRING', 'Returns a string of all elements in the collection separated by custom separator.'),
      new transformationDataModel.CustomFunctionDeclaration('lower-case', '', 'STRING', 'Converts string to all lower-case'),
      new transformationDataModel.CustomFunctionDeclaration('upper-case', '', 'STRING', 'Converts string to all upper-case'),
      new transformationDataModel.CustomFunctionDeclaration('reverse', '', 'STRING', 'Returns given string with its characters reversed'),
      /*    new transformationDataModel.CustomFunctionDeclaration(
        'string-as-keyword',
        '(defn string-as-keyword [s] ( when (seq s) (->   (str s) clojure.string/trim   (clojure.string/replace "(" "-") (clojure.string/replace ")" "") (clojure.string/replace " " "_") (clojure.string/replace "," "-") (clojure.string/replace "." "") (clojure.string/replace "/" "-") (clojure.string/replace "---" "-") (clojure.string/replace "--" "-") (clojure.string/replace ":" "") (clojure.string/replace "\\"" "") )))', 'STRING', 'Removes blanks and special symbols from a string thus making it possible to use it as a keyword'),*/
      new transformationDataModel.CustomFunctionDeclaration('remove-blanks', '(defn remove-blanks [s]  (when (seq s)  (clojure.string/replace s " " "")))', 'STRING', 'Removes blanks in a string'),
      new transformationDataModel.CustomFunctionDeclaration('titleize', '(defn titleize [st] (when (seq st) (let [a (clojure.string/split st (read-string "#\\" \\"")) c (map clojure.string/capitalize a)]  (->> c (interpose " ") (apply str) clojure.string/trim))))', 'STRING', 'Capitalizes each word in a string'),
      new transformationDataModel.CustomFunctionDeclaration('trim', '', 'STRING', 'Removes whitespace from both ends of string'),
      new transformationDataModel.CustomFunctionDeclaration('trim-newline',
        '', 'STRING', 'Removes all trailing newline \n or return \r characters from string'),
      new transformationDataModel.CustomFunctionDeclaration('triml', '', 'STRING',
        'Removes whitespace from the left side of string'),
      new transformationDataModel.CustomFunctionDeclaration('trimr', '', 'STRING',
        'Removes whitespace from the right side of string'),
      new transformationDataModel.CustomFunctionDeclaration('str', '', 'STRING',
        'With one arg x, returns x.toString(). (str nil) returns the empty string. With more than one arg, returns the concatenation of the str values of the args.'),
      new transformationDataModel.CustomFunctionDeclaration('rem', '', 'NUMBER',
        'Returns remainder of dividing numerator by denominator')];
    customfunctions.sort(function (a, b) {
      if (a.name > b.name) {
        return 1;

      } else {
        return -1;
      }

    });

    customfunctions.push(
      new transformationDataModel.CustomFunctionDeclaration(
        'get-lat-long-strings-replacement',
        '(defn get-lat-long-strings-replacement [easting northing hemisphere zoneNumber] (let [utmCoords (. gov.nasa.worldwind.geom.coords.UTMCoord fromUTM (Integer/parseInt zoneNumber) (if (= hemisphere "N") "gov.nasa.worldwind.avkey.North" (if (= hemisphere "S") "gov.nasa.worldwind.avkey.East" (throw (Exception. "Wrong hemisphere input")))) (Double/parseDouble easting) (Double/parseDouble northing))] (vector (re-pattern easting) (str (.getDegrees (.getLongitude utmCoords))) (re-pattern northing) (str (.getDegrees (.getLatitude utmCoords))))))',
        'SERVICE',
        'Produces a pair of replacement coordinates for the given easting, northing, hemisphere letter and zone number'),

      new transformationDataModel.CustomFunctionDeclaration(
        'replace-several',
        '(defn replace-several [content replacements] (let [replacement-list (partition 2 replacements)] (reduce (fn [arg1 arg2] (apply clojure.string/replace arg1 arg2)) content replacement-list)))',
        'SERVICE',
        'Replace several strings in another string based on a map of replacement pairs (used with "get-lat-long-strings-replacement" results to convert coordinates)'),

      new transformationDataModel.CustomFunctionDeclaration(
        'convert-col-lat-long',
        '(defn convert-col-lat-long [col hemisphere zoneNumber] (let [all-coords (re-seq (re-pattern "-?[0-9.]+?(?=[, )])") col)] (replace-several col (flatten (map (fn [coord-pair] (get-lat-long-strings-replacement (nth coord-pair 0) (nth coord-pair 1) hemisphere zoneNumber)) (partition 2 all-coords))))))',
        'SERVICE',
        'Convert coordinate pairs in a given cell by input hemisphere string ("N" or "S") and zone number (e.g., 32)')
    );

    var predicatefunctions = [
      new transformationDataModel.CustomFunctionDeclaration('empty?', '', 'PREDICATE', 'Returns true if given collection has no items'),
      new transformationDataModel.CustomFunctionDeclaration('not-empty?', '(def not-empty? (complement empty?))', 'PREDICATE', 'Returns true if given collection has at least 1 item'),
      new transformationDataModel.CustomFunctionDeclaration('every?', '', 'PREDICATE', 'Returns true if first argument predicate is logical true for every x in collection, else false'),
      new transformationDataModel.CustomFunctionDeclaration('false?', '', 'PREDICATE', 'Returns true if given value is the value false, false otherwise'),
      new transformationDataModel.CustomFunctionDeclaration('float?', '', 'PREDICATE', 'Returns true if given value is a floating point number'),
      new transformationDataModel.CustomFunctionDeclaration('keyword?', '', 'PREDICATE', 'Return true if given argument is a Keyword'),
      new transformationDataModel.CustomFunctionDeclaration('neg?', '', 'PREDICATE', 'Returns true if argument is less than zero, else false'),
      new transformationDataModel.CustomFunctionDeclaration('nil?', '', 'PREDICATE', 'Returns true if argument is nil, false otherwise'),
      new transformationDataModel.CustomFunctionDeclaration('number?', '', 'PREDICATE', 'Returns true if argument is a Number'),
      new transformationDataModel.CustomFunctionDeclaration('odd?', '', 'PREDICATE', 'Returns true if argument is odd, throws an exception if it is not an integer'),
      new transformationDataModel.CustomFunctionDeclaration('pos?', '', 'PREDICATE', 'Returns true if argument is greater than zero, else false'),
      new transformationDataModel.CustomFunctionDeclaration('ratio?', '', 'PREDICATE', 'Returns true if argument is a Ratio'),
      new transformationDataModel.CustomFunctionDeclaration('rational?', '', 'PREDICATE', 'Returns true if argument is a rational number'),
      new transformationDataModel.CustomFunctionDeclaration('string?', '', 'PREDICATE', 'Return true if argument is a String'),
      new transformationDataModel.CustomFunctionDeclaration('true?', '', 'PREDICATE', 'Returns true if argument is the value true, false otherwise'),
      new transformationDataModel.CustomFunctionDeclaration('zero?', '', 'PREDICATE', 'Returns true if argument is zero, else false')];

    var numericcustomfunctions = [
      new transformationDataModel.CustomFunctionDeclaration(' +', '', 'NUMBER', ''),
      new transformationDataModel.CustomFunctionDeclaration('-', '', 'NUMBER', ''),
      new transformationDataModel.CustomFunctionDeclaration('*', '', 'NUMBER', ''),
      new transformationDataModel.CustomFunctionDeclaration('/', '', 'NUMBER', '')];

    this.allCustomFunctions = customfunctions.concat(predicatefunctions.concat(numericcustomfunctions));
  }

  public updateTransformationCustomFunctionDeclarations(transformation: any): boolean {
    var updatedTransformation = false;
    // null safety first
    if (transformation.customFunctionDeclarations) {
      if (transformation.customFunctionDeclarations.length) {

        for (let expCfd of this.allCustomFunctions) {
          let foundCfd = false;
          for (let cfd of transformation.customFunctionDeclarations) {
            if (cfd.name === expCfd.name) {
              foundCfd = true;
              break;
            }
          }
          if (!foundCfd) {
            transformation.addCustomFunctionDeclaration(expCfd.name, expCfd.clojureCode, expCfd.group, expCfd.docstring);
            if (!updatedTransformation) {
              updatedTransformation = true;
            }
          }
        }
      }
    }
    return updatedTransformation;
  }

}

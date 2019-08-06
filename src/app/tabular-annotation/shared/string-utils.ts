import {Injectable} from '@angular/core';
import * as nlp from 'wink-nlp-utils';

@Injectable()
export class StringUtils {

  static stringPreprocessing(string) {
    // Retains only alpha, numerals, and removes all other characters from the input string,
    // including leading, trailing and extra in-between whitespaces.
    string = nlp.string.retainAlphaNums(string);

    // TODO: evaluate if these steps are needed
    // string = string
    // // insert a space between lower & upper
    //   .replace(/([a-z])([A-Z])/g, '$1 $2')
    //   // space before last upper in a sequence followed by lower
    //   .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
    //   // uppercase the first character
    //   .replace(/^./, function(str) { return str.toUpperCase(); });
    // // tokenize string
    // let tokens = nlp.string.tokenize(string);
    // // remove stop words
    // tokens = nlp.tokens.removeWords(tokens);
    // // create string from tokens
    // string = tokens.join(' ');

    // create a camel case string
    const words = string.split(' ');
    for (let i = 1; i < words.length; ++i) {
      words[i] = words[i][0].toUpperCase() + words[i].substr(1);
    }
    string = words.join('');

    return string;
  }

}

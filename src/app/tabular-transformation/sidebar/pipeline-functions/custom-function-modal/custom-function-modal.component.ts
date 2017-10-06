import { Component, OnInit, Input, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';
import { SelectItem } from 'primeng/primeng';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';

import * as data from '../../../../../assets/data.json';
import 'codemirror/mode/clojure/clojure';
import * as _ from 'lodash';

@Component({
  selector: 'custom-function-modal',
  templateUrl: './custom-function-modal.component.html',
  styleUrls: ['./custom-function-modal.component.css']
})

export class CustomFunctionModalComponent implements OnInit, OnChanges {
  @ViewChild('editor') editor: any;
  @Input() modalEnabled;

  private functions: any[] = [];
  private customFunctionDeclarations: any[] = [];
  // Transformation is needed to search for prefixers/functions
  //@Input() transformation: any;
  private transformation: any;
  private selected: any;
  private config: any;
  private content: any;
  private nameWarning: boolean = false;

  constructor(private completerService: CompleterService) {

    //TODO: remove when passing transformation is implemented
    this.transformation = transformationDataModel.Transformation.revive(data);
    for (let cfd of this.transformation.customFunctionDeclarations) {
      if (cfd.group == 'UTILITY') this.functions.push({ label: cfd.name, value: cfd });
      this.customFunctionDeclarations.push(cfd);
    }

    this.selected = { clojureCode: '' };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.selected) { console.log(this.selected); }
    //Fixing bug with displaying ng2-codemirror in the modal. Codemirror needs to be refreshed and cursor set up
    if (changes.modalEnabled.currentValue == true) {
      let cm = this.editor.instance;
      console.log(cm);
      setTimeout(function () {
        cm.refresh();

        // Set cursor to the end
        let posCursor = { line: 0, ch: 0 };
        posCursor.line = cm.doc.children[0].lines.length - 1;
        posCursor.ch = cm.doc.children[0].lines[posCursor.line].text.length;

        cm.doc.setCursor(posCursor);
      }, 200);
    }
  }

  ngOnInit() {
    this.modalEnabled = false;


  }

  onChange($event) {

  }

  onCodeChange($event) {
    /*    let functionName = /\(defn?\s+([^\s\)]+)/i;
    
    
        let code = this.selected.clojureCode;
        if (!code) return;
    
        var m = code.match(functionName);
        var d = code.match(/".*?"/g);
        if (d) this.selected.docstring = d[0].replace(/^"|"$/g, '');
    
        if (m) {
          var name = m[1];
          if (!this.selected.name) {
            this.selected.name = name;
          } else {
            this.selected.name = name;
            var found = _.find(this.customFunctionDeclarations, function (v) {
              return v.clojureCode !== this.selected.clojureCode && v.name === name;
            });
    
            this.nameWarning = !!found;
          }
        }
    
    */
  }

  removeFunction(i: number) {
    this.customFunctionDeclarations.splice(i, 1);
    this.functions.splice(i, 1);
    this.selected = { clojureCode: '' };
  }

  accept() {
    this.transformation.customFunctionDeclarations = this.customFunctionDeclarations;
    this.modalEnabled = false;
  }


  cancel() {
    this.modalEnabled = false;
  }
  private randomA = ['convert', 'do', 'analyse', 'parse', 'process', 'ignore', 'compute', 'apply'];
  private randomB = ['method', 'value', 'object', 'world', 'data', 'data', 'life', 'rabbit'];

  addFunction() {
    let name = '';
    let docstring = '';
    let cpt = 0;
    let find = function (v) { return v.name === name; };

    do {
      name = this.randomA[Math.floor(Math.random() * this.randomA.length)] + '-' + this.randomB[Math.floor(Math.random() * this.randomB.length)];
    } while (_.find(this.transformation.customFunctionDeclarations, find) && ++cpt < 10);

    let emptyCustomFunction = new transformationDataModel.CustomFunctionDeclaration(name, '(defn ' + name + ' "" [] ())', 'UTILITY', '')
    this.customFunctionDeclarations.push(emptyCustomFunction);
    this.functions.push({ label: name, value: emptyCustomFunction });

    this.selected = this.customFunctionDeclarations[this.customFunctionDeclarations.length - 1];



  }

}

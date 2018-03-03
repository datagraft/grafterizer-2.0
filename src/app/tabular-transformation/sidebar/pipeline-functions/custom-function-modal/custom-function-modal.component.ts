import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { SelectItem } from 'primeng/primeng';

import { Subscription } from 'rxjs/Subscription';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { CodemirrorService } from '@nomadreservations/ngx-codemirror';
import 'codemirror/mode/clojure/clojure';
import * as lodash from 'lodash';

@Component({
  selector: 'custom-function-modal',
  templateUrl: './custom-function-modal.component.html',
  styleUrls: ['./custom-function-modal.component.css']
})

export class CustomFunctionModalComponent implements OnInit {

  @ViewChild('editor') editor: any;

  private modalEnabled: any;
  private functions: any[] = [];
  private customFunctionDeclarations: any[] = [];
  private configurationObject: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any;

  private previewedTransformationObj: any;
  private previewedTransformationSubscription: Subscription;

  private transformation: any;
  private selected: any;
  private nameWarning: boolean = false;

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService, private codeMirror: CodemirrorService) { }

  ngOnInit() {
    this.configurationObject = { lineWrapping: true, lineNumbers: false, theme: "monokai", mode: 'clojure', autofocus: true, matchBrackets: true, indentWithTabs: true };
    this.modalEnabled = false;
    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
      if (currentEvent.newStepType === 'CustomFunctionDeclaration') {
        if (this.functions[0] == null) {
          for (let cfd of this.previewedTransformationObj.customFunctionDeclarations) {
            if (cfd.group === 'UTILITY') {
              this.functions.push({ label: cfd.name, value: cfd });
              this.customFunctionDeclarations.push(cfd);
            }
          }
        }
        this.modalEnabled = true;
      }
    });
    this.previewedTransformationSubscription = this.transformationSvc.currentPreviewedTransformationObj
      .subscribe((previewedTransformation) => {
        this.previewedTransformationObj = previewedTransformation;
      });
    this.selected = { clojureCode: '' };
  }

  ngAfterViewInit() {
    // TODO: set cursor to the end of line
    /*     let cm = this.editor.instance;
        setTimeout(() => {
          cm.refresh();
          let posCursor = { line: 0, ch: 0 };
          posCursor.line = cm.doc.children[0].lines.length - 1;
          posCursor.ch = cm.doc.children[0].lines[posCursor.line].text.length;
          cm.doc.setCursor(posCursor);
        }, 200); */
  }

  ngOnDestroy() {
    this.previewedTransformationSubscription.unsubscribe();
    this.pipelineEventsSubscription.unsubscribe();
  }

  onCodeChange($event) {
    let label = this.selected.name;
    let functionName = /\(defn?\s+([^\s\)]+)/i;
    if (!this.selected.clojureCode) {
      return;
    };
    var docstring = this.selected.clojureCode.match(/".*?"/g);
    if (this.selected.clojureCode.match(/".*?"/g)) {
      this.selected.docstring = docstring[0].replace(/^"|"$/g, '');
    };
    if (this.selected.clojureCode.match(functionName)) {
      var name = this.selected.clojureCode.match(functionName)[1];
      this.selected.name = name;
      if (!this.selected.name) {
        this.selected.name = name;
      } else {
        this.selected.name = name;
        var found = lodash.find(this.customFunctionDeclarations, (customFunction) => {
          return customFunction.clojureCode !== this.selected.clojureCode && customFunction.name === name;
        });
        this.nameWarning = !!found;
      }
      for (let funct of this.functions) {
        if (funct.label === label) {
          funct.label = name;
        }
      }
    }
  }

  private randomA = ['convert', 'do', 'analyse', 'parse', 'process', 'ignore', 'compute', 'apply'];
  private randomB = ['method', 'value', 'object', 'world', 'data', 'data', 'life', 'rabbit'];

  addFunction() {
    let name = '';
    let docstring = '';
    let cpt = 0;
    let find = (funct) => { return funct.name === name; };

    do { name = this.randomA[Math.floor(Math.random() * this.randomA.length)] + '-' + this.randomB[Math.floor(Math.random() * this.randomB.length)] }
    while (lodash.find(this.previewedTransformationObj.customFunctionDeclarations, find) && ++cpt < 10);

    let emptyCustomFunction = new transformationDataModel.CustomFunctionDeclaration(name, '(defn ' + name + ' "" [] ())', 'UTILITY', '')
    this.customFunctionDeclarations.push(emptyCustomFunction);
    this.functions.push({ label: name, value: emptyCustomFunction });
    this.selected = this.customFunctionDeclarations[this.customFunctionDeclarations.length - 1];
  }

  removeFunction(i: number) {
    this.customFunctionDeclarations.splice(i, 1);
    this.functions.splice(i, 1);
    this.selected = { clojureCode: '' };
  }

  accept() {
    this.previewedTransformationObj.customFunctionDeclarations = this.customFunctionDeclarations;
    this.transformationSvc.changePreviewedTransformationObj(this.previewedTransformationObj);
    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}

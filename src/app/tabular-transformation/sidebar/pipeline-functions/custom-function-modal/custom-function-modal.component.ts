import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { SelectItem } from 'primeng/primeng';

import { Subscription } from 'rxjs';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { CodemirrorService } from '@nomadreservations/ngx-codemirror';
import 'codemirror/mode/clojure/clojure';
import * as lodash from 'lodash';

@Component({
  selector: 'custom-function',
  templateUrl: './custom-function-modal.component.html',
  styleUrls: ['./custom-function-modal.component.css']
})

export class CustomFunctionModalComponent implements OnInit {

  @ViewChild('editor') editor: any;

  modalEnabled: any = false;
  userDefinedFunctions: any[] = [];
  private customFunctionDeclarations: any[] = [];
  configurationObject: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any;

  private transformationObjSourceSubscription: Subscription;
  private transformationObjSource: any;

  selected: any;
  nameWarning: boolean = false;

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService, private codeMirror: CodemirrorService) { }

  ngOnInit() {
    this.configurationObject = { lineWrapping: true, lineNumbers: false, theme: "monokai", mode: 'clojure', autofocus: true, matchBrackets: true, indentWithTabs: true };
    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
      if (currentEvent.newStepType === 'CustomFunctionDeclaration') {
        if (this.userDefinedFunctions[0] == null) {
          this.retreiveCustomFunctions();
        }
        this.modalEnabled = true;
      }
    });

    this.transformationObjSourceSubscription = this.transformationSvc.transformationObjSource.subscribe((transformationObjSource) => {
      this.transformationObjSource = transformationObjSource;
    });

    this.selected = { clojureCode: '' };
  }

  ngAfterViewInit() {
    this.codeMirror.instance$.subscribe((editor) => {
      this.editor = editor;
    });
  }

  ngOnDestroy() {
    this.pipelineEventsSubscription.unsubscribe();
    this.transformationObjSourceSubscription.unsubscribe();
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
        var found = lodash.find(this.userDefinedFunctions, (customFunction) => {
          return customFunction.clojureCode !== this.selected.clojureCode && customFunction.name === name;
        });
        this.nameWarning = !!found;
      }
      for (let funct of this.userDefinedFunctions) {
        if (funct.label === label) {
          funct.label = name;
        }
      }
    }
  }

  retreiveCustomFunctions() {
    for (let cfd of this.transformationObjSource.customFunctionDeclarations) {
      if (cfd.group === 'UTILITY') {
        this.userDefinedFunctions.push({ label: cfd.name, value: cfd });
      }
      else {
        this.customFunctionDeclarations.push(cfd);
      }
    }
    if (this.userDefinedFunctions.length) {
      this.selected = this.userDefinedFunctions[0].value;
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
    while (lodash.find(this.transformationObjSource.customFunctionDeclarations, find) && ++cpt < 10);

    let emptyCustomFunction = new transformationDataModel.CustomFunctionDeclaration(name, '(defn ' + name + ' "" [] ())', 'UTILITY', '')
    this.userDefinedFunctions.push({ label: name, value: emptyCustomFunction });
    this.selected = this.userDefinedFunctions[this.userDefinedFunctions.length - 1].value;
  }

  removeFunction(i: number) {
    this.userDefinedFunctions.splice(i, 1);
    if (this.userDefinedFunctions.length) {
      this.selected = this.userDefinedFunctions[0].value;
    }
  }

  resetModal() {
    this.pipelineEventsSvc.changePipelineEvent({
      cancel: true
    });
    this.userDefinedFunctions = [];
    this.customFunctionDeclarations = [];
    this.selected = { clojureCode: '' };
    this.editor.setValue('');
    this.modalEnabled = false;
  }

  accept() {
    for (let cfd of this.userDefinedFunctions) {
      if (cfd.value.group === 'UTILITY') {
        this.customFunctionDeclarations.push(cfd.value);
      }
    }
    this.transformationObjSource.customFunctionDeclarations = this.customFunctionDeclarations;
    this.transformationSvc.transformationObjSource.next(this.transformationObjSource);
    this.transformationSvc.previewedTransformationObjSource.next(this.transformationObjSource);
    this.resetModal();
  }

  cancel() {
    this.resetModal();
  }

}

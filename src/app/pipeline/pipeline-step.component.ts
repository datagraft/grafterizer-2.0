import { Component, OnInit, Input, OnChanges, SimpleChange } from '@angular/core';
import { PipelineFunction } from './pipelineFunction';


@Component({
  selector: 'pipeline-step',
  templateUrl: './pipeline-step.component.html',
  styleUrls: ['./pipeline-step.component.css']
})
export class PipelineStepComponent implements OnChanges {
  functions: AvailableFunction[] = availableFunctions;
  @Input() function: PipelineFunction;
  //TODO: pass the transformations
  @Input() transformation: string;
  selectedFunctionName: string;
  onSelect(selectedFunction: AvailableFunction): void {
    this.selectedFunctionName = selectedFunction.name;
  };
  constructor() {

    // this.selectedFunctionName = this.function ? this.function.name : ""
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
console.log(this.function);

    if (!changes["function"].isFirstChange())
      if (changes["function"].currentValue) this.selectedFunctionName = changes["function"].currentValue.name;
      else this.selectedFunctionName = "";
  }

}
const availableFunctions: AvailableFunction[] = [
  {
    displayName: 'Make Dataset',
    name: 'make-dataset',
    type: 'none'
  },
  {
    displayName: 'Custom function',
    name: 'utility',
    type: 'utility'
  },
  {
    displayName: 'Reshape Dataset',
    name: 'melt',
    type: 'none'
  },
  {
    displayName: 'Sort Dataset',
    name: 'sort-dataset',
    type: 'none'
  },
  {
    displayName: 'Remove Duplicates',
    name: 'remove-duplicates',
    type: 'none'
  },
  {
    displayName: 'Group and Aggregate',
    name: 'group-rows',
    type: 'none'
  },
  {
    displayName: 'Add Columns',
    name: 'add-columns',
    type: 'column'
  },
  {
    displayName: 'Take/Drop Columns',
    name: 'columns',
    type: 'column'
  },
  {
    displayName: 'Derive Column',
    name: 'derive-column',
    type: 'column'
  },
  {
    displayName: 'Merge Columns',
    name: 'merge-columns',
    type: 'column'
  },
  {
    displayName: 'Map Columns',
    name: 'mapc',
    type: 'column'
  },
  {
    displayName: 'Rename Columns',
    name: 'rename-columns',
    type: 'column'
  },
  {
    displayName: 'Shift Column',
    name: 'shift-column',
    type: 'column'
  },
  {
    displayName: 'Split Column',
    name: 'split',
    type: 'column'
  },
  {
    displayName: 'Add Row',
    name: 'add-row',
    type: 'rows'
  },
  {
    displayName: 'Fill Rows',
    name: 'fill-rows',
    type: 'rows'
  },
  {
    displayName: 'Merge Rows',
    name: 'merge-rows',
    type: 'rows'
  },
  {
    displayName: 'Shift Row',
    name: 'shift-row',
    type: 'rows'
  },
  {
    displayName: 'Take/Drop Rows',
    name: 'drop-rows',
    type: 'rows'
  },
  {
    displayName: 'Filter Rows',
    name: 'grep',
    type: 'rows'
  }
];
const functionGroups: string[] = ['rows', 'column'];
export class AvailableFunction {
  displayName: string;
  name: string;
  type: string;
}
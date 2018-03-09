import { Component, OnInit, Input } from '@angular/core';
import { RdfNodeMappingDialogComponent } from 'app/rdf-mapping/graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog.component';

@Component({
  selector: 'constant-literal-node',
  templateUrl: './constant-literal-node.component.html',
  entryComponents: [RdfNodeMappingDialogComponent],
  styleUrls: ['../graph-mapping-node-components.scss']
})
export class ConstantLiteralNodeComponent implements OnInit {
  @Input() node: any;
  @Input() parent: any;
  private showActions = false;

  constructor() { }

  ngOnInit() {
  }

  editNode() {
    console.log('Edit Node' + this.node);
  }

  addSiblingNode() {
    console.log('ADD SIBLING NODE');
  }

  removeNode() {
    console.log('REMOVE NODE');
  }

  showNodeActions() {
    this.showActions = true;
  }

  hideNodeActions() {
    this.showActions = false;
  }
}

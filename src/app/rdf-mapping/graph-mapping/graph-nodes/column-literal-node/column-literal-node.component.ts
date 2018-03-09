import { Component, OnInit, Input, ViewContainerRef, ViewChild } from '@angular/core';
import { RdfNodeMappingDialogComponent } from 'app/rdf-mapping/graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog.component';
import { RdfNodeMappingDialogAnchorDirective } from 'app/rdf-mapping/graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog-anchor.directive';

@Component({
  selector: 'column-literal-node',
  templateUrl: './column-literal-node.component.html',
  entryComponents: [RdfNodeMappingDialogComponent],
  styleUrls: ['../graph-mapping-node-components.scss']
})
export class ColumnLiteralNodeComponent implements OnInit {
  @Input() node: any;
  @Input() parent: any;
  private showActions = false;

  @ViewChild(RdfNodeMappingDialogAnchorDirective) dialogAnchor: RdfNodeMappingDialogAnchorDirective;

  constructor(private viewContainer: ViewContainerRef) { }

  ngOnInit() {
  }

  editNode() {
    let componentRef = this.dialogAnchor.createDialog(RdfNodeMappingDialogComponent);
    componentRef.instance.selectTab('literal');
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

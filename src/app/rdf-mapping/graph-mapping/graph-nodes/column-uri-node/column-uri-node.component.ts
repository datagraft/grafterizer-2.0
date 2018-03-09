import { Component, OnInit, Input, ViewContainerRef, ViewChild } from '@angular/core';
import { RdfNodeMappingDialogComponent } from '../../rdf-node-mapping-dialog/rdf-node-mapping-dialog.component';
import { RdfNodeMappingDialogAnchorDirective } from '../../rdf-node-mapping-dialog/rdf-node-mapping-dialog-anchor.directive';

@Component({
  selector: 'column-uri-node',
  templateUrl: './column-uri-node.component.html',
  entryComponents: [RdfNodeMappingDialogComponent],
  styleUrls: ['../graph-mapping-node-components.scss']
})
export class ColumnUriNodeComponent implements OnInit {
  @Input() node: any;
  @Input() parent: any;
  private showActions = false;

  @ViewChild(RdfNodeMappingDialogAnchorDirective) dialogAnchor: RdfNodeMappingDialogAnchorDirective;

  constructor(private viewContainer: ViewContainerRef) {

  }

  editNode() {
    let componentRef = this.dialogAnchor.createDialog(RdfNodeMappingDialogComponent);
    componentRef.instance.selectTab('uri');
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

  ngOnInit() {
    console.log(this.node);
  }

}

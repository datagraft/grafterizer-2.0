import { Component, OnInit, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { RdfNodeMappingDialogAnchorDirective } from 'app/rdf-mapping/graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog-anchor.directive';
import { RdfNodeMappingDialogComponent } from 'app/rdf-mapping/graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog.component';

@Component({
  selector: 'graph-mapping',
  templateUrl: './graph-mapping.component.html',
  entryComponents: [RdfNodeMappingDialogComponent],
  styleUrls: ['./graph-mapping.component.css']
})
export class GraphMappingComponent implements OnInit {

  @Input() graph;

  openNodeMappingDialog = false;
  @ViewChild(RdfNodeMappingDialogAnchorDirective) dialogAnchor: RdfNodeMappingDialogAnchorDirective;

  constructor(private viewContainer: ViewContainerRef) { }

  ngOnInit() {
  }

  addFirstNode() {
    let componentRef = this.dialogAnchor.createDialog(RdfNodeMappingDialogComponent);
    componentRef.instance.loadNode(null, this.graph, null);
  }
}

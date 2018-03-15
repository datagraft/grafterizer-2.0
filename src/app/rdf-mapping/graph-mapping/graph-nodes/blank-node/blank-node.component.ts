import { Component, OnInit, Input, ViewContainerRef, ViewChild } from '@angular/core';
import { RdfNodeMappingDialogComponent } from 'app/rdf-mapping/graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog.component';
import { RdfNodeMappingDialogAnchorDirective } from 'app/rdf-mapping/graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog-anchor.directive';
import { PropertyNodeDialogAnchorDirective } from 'app/rdf-mapping/graph-mapping/property-node-dialog/property-node-dialog-anchor.directive';
import { PropertyNodeDialogComponent } from 'app/rdf-mapping/graph-mapping/property-node-dialog/property-node-dialog.component';

@Component({
  selector: 'blank-node',
  templateUrl: './blank-node.component.html',
  entryComponents: [RdfNodeMappingDialogComponent, PropertyNodeDialogComponent],
  styleUrls: ['../graph-mapping-node-components.scss']
})
export class BlankNodeComponent implements OnInit {
  @Input() node: any;
  @Input() parent: any;

  @ViewChild(RdfNodeMappingDialogAnchorDirective) rdfNodeDialogAnchor: RdfNodeMappingDialogAnchorDirective;
  @ViewChild(PropertyNodeDialogAnchorDirective) propertyDialogAnchor: PropertyNodeDialogAnchorDirective;

  constructor(private viewContainer: ViewContainerRef) { }

  ngOnInit() {
  }

  editNode() {
    let componentRef = this.rdfNodeDialogAnchor.createDialog(RdfNodeMappingDialogComponent);
    componentRef.instance.loadNode(this.node, this.parent, null);
  }

  addChildNode() {
    let componentRef = this.propertyDialogAnchor.createDialog(PropertyNodeDialogComponent);
    componentRef.instance.loadProperty(null, this.node, null);
  }

}

import { Component, OnInit, Input, ViewChild, ViewContainerRef, OnDestroy } from '@angular/core';
import { RdfNodeMappingDialogComponent } from 'app/rdf-mapping/graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog.component';
import { RdfNodeMappingDialogAnchorDirective } from 'app/rdf-mapping/graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog-anchor.directive';
import { TransformationService } from 'app/transformation.service';
import { Subscription } from 'rxjs';
import { PropertyNodeDialogAnchorDirective } from 'app/rdf-mapping/graph-mapping/property-node-dialog/property-node-dialog-anchor.directive';
import { PropertyNodeDialogComponent } from 'app/rdf-mapping/graph-mapping/property-node-dialog/property-node-dialog.component';

@Component({
  selector: 'constant-uri-node',
  templateUrl: './constant-uri-node.component.html',
  entryComponents: [RdfNodeMappingDialogComponent, PropertyNodeDialogComponent],
  styleUrls: ['../graph-mapping-node-components.scss']
})
export class ConstantUriNodeComponent implements OnInit, OnDestroy {
  @Input() node: any;
  @Input() parent: any;
  private showActions = false;

  nodeRemoveModal = false;
  private transformationSubscription: Subscription;
  private transformationObj: any;

  @ViewChild(RdfNodeMappingDialogAnchorDirective) rdfNodeDialogAnchor: RdfNodeMappingDialogAnchorDirective;
  @ViewChild(PropertyNodeDialogAnchorDirective) propertyDialogAnchor: PropertyNodeDialogAnchorDirective;

  constructor(private transformationSvc: TransformationService) {

  }

  ngOnInit() {
    this.transformationSubscription = this.transformationSvc.transformationObjSource.subscribe((transformation) => {
      this.transformationObj = transformation;
    });
  }

  ngOnDestroy() {
    this.transformationSubscription.unsubscribe();
  }

  editNode() {
    let componentRef = this.rdfNodeDialogAnchor.createDialog(RdfNodeMappingDialogComponent);
    componentRef.instance.loadNode(this.node, this.parent, null);
  }

  addChildNode() {
    let componentRef = this.propertyDialogAnchor.createDialog(PropertyNodeDialogComponent);
    componentRef.instance.loadProperty(null, this.node, null);
  }

  addSiblingNode() {
    let componentRef = this.rdfNodeDialogAnchor.createDialog(RdfNodeMappingDialogComponent);
    componentRef.instance.loadNode(null, this.parent, this.node);
  }

  removeNode() {
    this.nodeRemoveModal = true;
  }

  cancelDelete() {
    this.nodeRemoveModal = false;
  }

  confirmDelete() {
    this.parent.removeChild(this.node);
    this.transformationSvc.transformationObjSource.next(this.transformationObj);
    this.nodeRemoveModal = false;
  }

  showNodeActions() {
    this.showActions = true;
  }

  hideNodeActions() {
    this.showActions = false;
  }
}

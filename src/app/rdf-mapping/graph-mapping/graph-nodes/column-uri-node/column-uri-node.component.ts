import { Component, OnInit, Input, ViewContainerRef, ViewChild, OnDestroy } from '@angular/core';
import { RdfNodeMappingDialogComponent } from '../../rdf-node-mapping-dialog/rdf-node-mapping-dialog.component';
import { RdfNodeMappingDialogAnchorDirective } from '../../rdf-node-mapping-dialog/rdf-node-mapping-dialog-anchor.directive';
import { TransformationService } from 'app/transformation.service';
import { Subscription } from 'rxjs';
import { PropertyNodeDialogComponent } from '../../property-node-dialog/property-node-dialog.component';
import { PropertyNodeDialogAnchorDirective } from '../../property-node-dialog/property-node-dialog-anchor.directive';

@Component({
  selector: 'column-uri-node',
  templateUrl: './column-uri-node.component.html',
  entryComponents: [RdfNodeMappingDialogComponent, PropertyNodeDialogComponent],
  styleUrls: ['../graph-mapping-node-components.scss']
})
export class ColumnUriNodeComponent implements OnInit, OnDestroy {
  @Input() node: any;
  @Input() parent: any;
  private showActions = false;

  private transformationSubscription: Subscription;
  private transformationObj: any;
  nodeRemoveModal = false;

  @ViewChild(RdfNodeMappingDialogAnchorDirective) rdfNodeDialogAnchor: RdfNodeMappingDialogAnchorDirective;
  @ViewChild(PropertyNodeDialogAnchorDirective) propertyDialogAnchor: PropertyNodeDialogAnchorDirective;

  constructor(private transformationSvc: TransformationService, private viewContainer: ViewContainerRef) {

  }

  ngOnInit() {
    this.transformationSubscription = this.transformationSvc.currentTransformationObj.subscribe((transformation) => {
      this.transformationObj = transformation;
    });
  }

  getPrefixName(): string {
    return typeof this.node.prefix === 'object' ? this.node.prefix.value : this.node.prefix;
  }

  getNodeColumnName(): string {
    return typeof this.node.column === 'object' ? this.node.column.value : this.node.column;
  }

  editNode() {
    let componentRef = this.rdfNodeDialogAnchor.createDialog(RdfNodeMappingDialogComponent);
    componentRef.instance.loadNode(this.node, this.parent, null);
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

  addChildNode() {
    let componentRef = this.propertyDialogAnchor.createDialog(PropertyNodeDialogComponent);
    componentRef.instance.loadProperty(null, this.node, null);
  }

  confirmDelete() {
    this.parent.removeChild(this.node);
    this.transformationSvc.changeTransformationObj(this.transformationObj);
    this.nodeRemoveModal = false;
  }

  showNodeActions() {
    this.showActions = true;
  }

  hideNodeActions() {
    this.showActions = false;
  }

  ngOnDestroy() {
    this.transformationSubscription.unsubscribe();
  }

}

import { Component, OnInit, Input, ViewChild, OnDestroy } from '@angular/core';
import { PropertyNodeDialogComponent } from 'app/rdf-mapping/graph-mapping/property-node-dialog/property-node-dialog.component';
import { PropertyNodeDialogAnchorDirective } from 'app/rdf-mapping/graph-mapping/property-node-dialog/property-node-dialog-anchor.directive';
import { TransformationService } from 'app/transformation.service';
import { Subscription } from 'rxjs';
import { RdfNodeMappingDialogAnchorDirective } from '../../rdf-node-mapping-dialog/rdf-node-mapping-dialog-anchor.directive';
import { RdfNodeMappingDialogComponent } from 'app/rdf-mapping/graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog.component';

@Component({
  selector: 'property-node',
  templateUrl: './property-node.component.html',
  entryComponents: [PropertyNodeDialogComponent, RdfNodeMappingDialogComponent],
  styleUrls: ['../graph-mapping-node-components.scss']
})
export class PropertyNodeComponent implements OnInit, OnDestroy {
  propertyRemoveModal = false;
  @Input() property;
  @Input() parent;
  showActions = false;

  private transformationSubscription: Subscription;
  private transformationObj: any;

  @ViewChild(PropertyNodeDialogAnchorDirective) propertyDialogAnchor: PropertyNodeDialogAnchorDirective;
  @ViewChild(RdfNodeMappingDialogAnchorDirective) rdfNodeDialogAnchor: RdfNodeMappingDialogAnchorDirective;

  constructor(private transformationSvc: TransformationService) { }

  ngOnInit() {
    this.transformationSubscription = this.transformationSvc.currentTransformationObj.subscribe((transformation) => {
      this.transformationObj = transformation;
    });
  }

  ngOnDestroy() {
    this.transformationSubscription.unsubscribe();
  }

  editProperty() {
    let componentRef = this.propertyDialogAnchor.createDialog(PropertyNodeDialogComponent);
    componentRef.instance.loadProperty(this.property, this.parent, null);
  }

  addSiblingProperty() {
    let componentRef = this.propertyDialogAnchor.createDialog(PropertyNodeDialogComponent);
    componentRef.instance.loadProperty(null, this.parent, this.property);
  }

  removeProperty() {
    this.propertyRemoveModal = true;
  }

  cancelDelete() {
    this.propertyRemoveModal = false;
  }

  addChildNode() {
    let componentRef = this.rdfNodeDialogAnchor.createDialog(RdfNodeMappingDialogComponent);
    componentRef.instance.loadNode(null, this.property, null);
  }

  confirmDelete() {
    this.parent.removeChild(this.property);
    this.transformationSvc.changeTransformationObj(this.transformationObj);
    this.propertyRemoveModal = false;
  }

  showPropertyActions() {
    this.showActions = true;
  }

  hidePropertyActions() {
    this.showActions = false;
  }
}

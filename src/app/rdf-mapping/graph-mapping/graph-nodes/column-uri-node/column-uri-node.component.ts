import { Component, OnInit, Input, ViewContainerRef, ViewChild, OnDestroy } from '@angular/core';
import { RdfNodeMappingDialogComponent } from '../../rdf-node-mapping-dialog/rdf-node-mapping-dialog.component';
import { RdfNodeMappingDialogAnchorDirective } from '../../rdf-node-mapping-dialog/rdf-node-mapping-dialog-anchor.directive';
import { TransformationService } from 'app/transformation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'column-uri-node',
  templateUrl: './column-uri-node.component.html',
  entryComponents: [RdfNodeMappingDialogComponent],
  styleUrls: ['../graph-mapping-node-components.scss']
})
export class ColumnUriNodeComponent implements OnInit, OnDestroy {
  @Input() node: any;
  @Input() parent: any;
  private showActions = false;

  private transformationSubscription: Subscription;
  private transformationObj: any;
  private nodeRemoveModal = false;

  @ViewChild(RdfNodeMappingDialogAnchorDirective) dialogAnchor: RdfNodeMappingDialogAnchorDirective;

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
    let componentRef = this.dialogAnchor.createDialog(RdfNodeMappingDialogComponent);
    componentRef.instance.loadNode(this.node, this.parent, null);
  }

  addSiblingNode() {
    let componentRef = this.dialogAnchor.createDialog(RdfNodeMappingDialogComponent);
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

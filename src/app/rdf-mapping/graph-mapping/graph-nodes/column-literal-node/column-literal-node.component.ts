import { Component, OnInit, Input, ViewContainerRef, ViewChild, OnDestroy } from '@angular/core';
import { RdfNodeMappingDialogComponent } from 'app/rdf-mapping/graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog.component';
import { RdfNodeMappingDialogAnchorDirective } from 'app/rdf-mapping/graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog-anchor.directive';
import { Subscription } from 'rxjs';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'column-literal-node',
  templateUrl: './column-literal-node.component.html',
  entryComponents: [RdfNodeMappingDialogComponent],
  styleUrls: ['../graph-mapping-node-components.scss']
})
export class ColumnLiteralNodeComponent implements OnInit, OnDestroy {
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

  ngOnDestroy() {
    this.transformationSubscription.unsubscribe();
  }

  getNodeLiteralValue(): string {
    return typeof this.node.literalValue === 'object' ? this.node.literalValue.value : this.node.literalValue;
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
}

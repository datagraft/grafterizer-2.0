import { Component, OnInit, Input, ViewChild, ViewContainerRef, OnDestroy } from '@angular/core';
import { RdfNodeMappingDialogComponent } from 'app/rdf-mapping/graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog.component';
import { RdfNodeMappingDialogAnchorDirective } from 'app/rdf-mapping/graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog-anchor.directive';
import { TransformationService } from 'app/transformation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'constant-uri-node',
  templateUrl: './constant-uri-node.component.html',
  entryComponents: [RdfNodeMappingDialogComponent],
  styleUrls: ['../graph-mapping-node-components.scss']
})
export class ConstantUriNodeComponent implements OnInit, OnDestroy {
  @Input() node: any;
  @Input() parent: any;
  private showActions = false;

  private nodeRemoveModal = false;
  private transformationSubscription: Subscription;
  private transformationObj: any;

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

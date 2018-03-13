import { Directive, ViewContainerRef, ComponentRef, ComponentFactoryResolver } from '@angular/core';
import { RdfNodeMappingDialogComponent } from './rdf-node-mapping-dialog.component';

@Directive({
  selector: '[rdfNodeMappingDialogAnchor]'
})
export class RdfNodeMappingDialogAnchorDirective {

  constructor(private viewContainer: ViewContainerRef, private componentFactoryResolver: ComponentFactoryResolver) { }

  createDialog(dialogComponent: { new(...args: any[]): RdfNodeMappingDialogComponent }): ComponentRef<RdfNodeMappingDialogComponent> {
    this.viewContainer.clear();

    let dialogComponentFactory =
      this.componentFactoryResolver.resolveComponentFactory(dialogComponent);
    let dialogComponentRef = this.viewContainer.createComponent(dialogComponentFactory);

    dialogComponentRef.instance.close.subscribe(() => {
      dialogComponentRef.destroy();
    });

    return dialogComponentRef;
  }
}

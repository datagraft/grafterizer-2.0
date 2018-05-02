import { Directive, ViewContainerRef, ComponentFactoryResolver, ComponentRef } from '@angular/core';
import { RdfPrefixManagementDialogComponent } from 'app/rdf-mapping/graph-mapping/rdf-prefix-management-dialog/rdf-prefix-management-dialog.component';

@Directive({
  selector: '[rdfPrefixManagementDialogAnchor]'
})
export class RdfPrefixManagementDialogAnchorDirective {

  constructor(private viewContainer: ViewContainerRef, private componentFactoryResolver: ComponentFactoryResolver) { }

  createDialog(dialogComponent: { new(...args: any[]): RdfPrefixManagementDialogComponent }): ComponentRef<RdfPrefixManagementDialogComponent> {
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

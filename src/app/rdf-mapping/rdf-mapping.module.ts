import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RdfMappingComponent } from "./rdf-mapping.component";
import { RdfMappingRoutingModule } from "./rdf-mapping-routing.module";
import { PropertyNodeComponent } from './graph-mapping/graph-nodes/property-node/property-node.component';
import { ConstantUriNodeComponent } from './graph-mapping/graph-nodes/constant-uri-node/constant-uri-node.component';
import { ColumnUriNodeComponent } from './graph-mapping/graph-nodes/column-uri-node/column-uri-node.component';
import { ColumnLiteralNodeComponent } from './graph-mapping/graph-nodes/column-literal-node/column-literal-node.component';
import { ConstantLiteralNodeComponent } from './graph-mapping/graph-nodes/constant-literal-node/constant-literal-node.component';
import { BlankNodeComponent } from './graph-mapping/graph-nodes/blank-node/blank-node.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { GraphMappingComponent } from './graph-mapping/graph-mapping.component';
import { RdfNodeMappingDialogComponent } from './graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog.component';
import { ClarityModule } from 'clarity-angular';
import { RdfNodeMappingDialogAnchorDirective } from './graph-mapping/rdf-node-mapping-dialog/rdf-node-mapping-dialog-anchor.directive';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';





@NgModule({
  imports: [
    CommonModule,
    RdfMappingRoutingModule,
    MatButtonModule,
    MatTooltipModule,
    FlexLayoutModule,
    MatIconModule,
    ClarityModule,
    MatInputModule,
    FormsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    NgSelectModule,
    MatAutocompleteModule,
    MatDividerModule,
    MatSlideToggleModule,
  ],
  declarations: [
    RdfMappingComponent,
    PropertyNodeComponent,
    ConstantUriNodeComponent,
    ColumnUriNodeComponent,
    ColumnLiteralNodeComponent,
    ConstantLiteralNodeComponent,
    BlankNodeComponent,
    GraphMappingComponent,
    RdfNodeMappingDialogComponent,
    RdfNodeMappingDialogAnchorDirective
  ]
})

export class RdfMappingModule { }

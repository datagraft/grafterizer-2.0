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
import { GraphMappingComponent } from './graph-mapping/graph-mapping.component';


@NgModule({
  imports: [
    CommonModule,
    RdfMappingRoutingModule,
    MatButtonModule,
    MatTooltipModule,
    FlexLayoutModule,
    MatIconModule
  ],
  declarations: [
    RdfMappingComponent,
    PropertyNodeComponent,
    ConstantUriNodeComponent,
    ColumnUriNodeComponent,
    ColumnLiteralNodeComponent,
    ConstantLiteralNodeComponent,
    BlankNodeComponent,
    GraphMappingComponent
  ]
})

export class RdfMappingModule { }

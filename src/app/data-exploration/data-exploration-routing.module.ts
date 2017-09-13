import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DataExplorationComponent } from "./data-exploration.component";

const dataExplorationRoutes: Routes = [
    { path: 'data-exploration', component: DataExplorationComponent }
];

@NgModule({
    imports: [
        RouterModule.forChild(dataExplorationRoutes)
    ],
    exports: [
        RouterModule
    ]
})
export class DataExplorationRoutingModule { }
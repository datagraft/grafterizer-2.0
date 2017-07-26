import { NgModule }              from '@angular/core';
import { RouterModule, Routes }  from '@angular/router';

import { TabularTransformationComponent } from './tabular-transformation/tabular-transformation.component';

const appRoutes: Routes = [
  { path: 'tabular-transformation', component: TabularTransformationComponent },
  { path: '',   redirectTo: '/tabular-transformation', pathMatch: 'full' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    )
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { RoutingService } from '../routing.service';
import { RdfVocabularyService } from './rdf-vocabulary.service';
import { TransformationService } from '../transformation.service';
import { DataGraftMessageService } from '../data-graft-message.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import { RdfPrefixManagementDialogComponent } from './graph-mapping/rdf-prefix-management-dialog/rdf-prefix-management-dialog.component';
import { RdfPrefixManagementDialogAnchorDirective } from 'app/rdf-mapping/graph-mapping/rdf-prefix-management-dialog/rdf-prefix-management-dialog-anchor.directive';

declare var Handsontable: any;

@Component({
  selector: 'rdf-mapping',
  templateUrl: './rdf-mapping.component.html',
  styleUrls: ['./rdf-mapping.component.css'],
  entryComponents: [RdfPrefixManagementDialogComponent],
  providers: [RdfVocabularyService]
})

export class RdfMappingComponent implements OnInit, OnDestroy {
  previewedTransformationSubscription: Subscription;
  private dataLoading: boolean;
  private hot: any;
  private settings: any;
  private tableContainer: any;
  private vocabSvcPath: string;
  transformationReadOnlyView: boolean = false;
  showTable: boolean = true;

  // Local objects/ working memory initialized oninit - removed ondestroy, content transferred to observable ondestroy
  transformationObj: any;
  private graftwerkData: any;

  private transformationSubscription: Subscription;
  private dataSubscription: Subscription;

  private currentDataGraftStateSubscription: Subscription;
  private currentDataGraftState: string;


  @ViewChild(RdfPrefixManagementDialogAnchorDirective) rdfPrefixManagementAnchor: RdfPrefixManagementDialogAnchorDirective;

  constructor(private routingService: RoutingService, private route: ActivatedRoute, private router: Router,
    private transformationSvc: TransformationService, vocabService: RdfVocabularyService, private messageSvc: DataGraftMessageService) {
    route.url.subscribe(() => this.routingService.concatURL(route));
  }

  ngOnInit() {
    this.transformationSubscription =
      this.transformationSvc.transformationObjSource.subscribe((transformationObj) => {
        this.transformationObj = transformationObj;
      });

    this.tableContainer = document.getElementById('previewTable');

    this.settings = {
      data: [],
      rowHeaders: true,
      autoColumnSize: true,
      manualColumnResize: true,
      columnSorting: false,
      viewportColumnRenderingOffset: 30,
      wordWrap: true,
      stretchH: 'all',
      className: 'htCenter htMiddle',
      observeDOMVisibility: true,
      preventOverflow: false,
      fillHandle: false,
      readOnly: true,
      height: "50vh",
      afterChange: () => {
        setTimeout(() => {
          this.hot.render();
        }, 10);
      }
    };
    this.hot = new Handsontable(this.tableContainer, this.settings);

    this.currentDataGraftStateSubscription = this.messageSvc.currentDataGraftStateSrc.subscribe((state) => {
      const paramMap = this.route.snapshot.paramMap;
      if (state.mode) {
        this.currentDataGraftState = state.mode;
        switch (this.currentDataGraftState) {
          case 'transformations.readonly':
            this.transformationReadOnlyView = true;
            break;
          case 'transformations.transformation':
            if (!paramMap.has('filestoreId')) {
              this.showTable = false;
            }
            break;
        }
      }
    });

    this.previewedTransformationSubscription = this.transformationSvc.previewedTransformationObjSource.subscribe((previewedTransformation) => {
      this.dataLoading = true;
    });

    this.dataSubscription = this.transformationSvc.graftwerkDataSource.subscribe((graftwerkData) => {
      this.displayJsEdnData(graftwerkData);
    });
  }

  public displayJsEdnData(data: JSON) {
    if (data[':column-names'] && data[':rows']) {
      const columnNames = data[':column-names'];
      const rowData = data[':rows'];
      const columnMappings = [];
      // Remove leading ':' from the EDN response
      const colNamesClean = [];
      columnNames.forEach((colname, index) => {
        const colNameClean = colname.substring(1);
        colNamesClean.push(colNameClean);
        columnMappings.push({
          data: colname
        });
      });

      if (colNamesClean && columnMappings) {
        this.hot.updateSettings({
          colHeaders: colNamesClean,
          columns: columnMappings,
          data: data[':rows']
        });
      }
      this.dataLoading = false;
    } else {
      // TODO error handling one day!!
      throw new Error('Invalid format of data!');
    }
  }

  ngOnDestroy() {
    this.transformationSubscription.unsubscribe();
    this.dataSubscription.unsubscribe();
  }

  openPrefixManagementDialog() {
    let componentRef = this.rdfPrefixManagementAnchor.createDialog(RdfPrefixManagementDialogComponent);
  }

}

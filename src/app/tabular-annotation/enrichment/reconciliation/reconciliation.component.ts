import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatTableDataSource, Sort } from '@angular/material';
import { EnrichmentService } from '../enrichment.service';
import { ConciliatorService, DeriveMap, Mapping, Result, Type } from '../enrichment.model';
import { ClrDatagridComparatorInterface } from '@clr/angular';
import { AddEntityDialog} from './addEntityDialog.component';

export interface dialog_add_entity_data {
   name: string;
   link : string;
   score : number;
   matched: boolean;
   set_as_reconciled : boolean;

}

export interface DialogData {

  dialog_data: dialog_add_entity_data;


}

@Component({
  selector: 'app-reconciliation',
  templateUrl: './reconciliation.component.html',
  styleUrls: ['./reconciliation.component.css']
})
export class ReconciliationComponent implements OnInit {

  public data_for_add_entity_dialog : dialog_add_entity_data =
  { name: "", link : "",  score : 0, matched: false, set_as_reconciled :false};
  public filter_column = 0;
  public index_filtered_reconciled :number = 0;
  public index_added : number;
  public temp_option:string;
  public temp_score:number;
  public temp_link:string;
  public temp_match:boolean;
  public form_hidden = false;
  public selected =-1;
  public displayedColumns: string[] = ['position', 'original_value', 'reconciled_entity'];
  public dataSource = null;
  public dataSource_2 = null;
  public header: any;
  public reconciledData: any;
  public reconciledDataFiltered = null;
  public selectedGroup: any;
  public selectedService: string;
  public services: Map<string, ConciliatorService>;
  public newColumnName: string;
  public guessedType: Type;
  public showPreview: boolean;
  public dataLoading: boolean;
  public servicesGroups: string[];
  public servicesForSelectedGroup: ConciliatorService[];
  public threshold: number;
  public skippedCount: number;
  public matchedCount: number;
  public maxThresholdCount: number;
  public notReconciledCount: number;
  public shiftColumn: boolean = false;

  constructor(public dialogRef: MatDialogRef<ReconciliationComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogInputData: any, public dialog: MatDialog,
    private enrichmentService: EnrichmentService) { }

  ngOnInit() {
    this.header = this.dialogInputData.header;
    this.services = new Map();
    this.servicesGroups = [];
    this.enrichmentService.listServices().subscribe((data) => {
      Object.keys(data).forEach((serviceCategory) => {
        data[serviceCategory].forEach((service) => {
          this.services.set(service['id'], new ConciliatorService({ ...service, ...{ 'group': serviceCategory } }));
        });
        this.servicesGroups.push(serviceCategory);
      });
    });
    this.showPreview = false;
    this.dataLoading = false;
    this.reconciledData = [];
    this.threshold = 0.8;
    this.skippedCount = 0;

  }

  public reconcile() {
    this.dataLoading = true;
    this.showPreview = true;
    this.enrichmentService.reconcileColumn(this.header, this.services.get(this.selectedService)).subscribe((data) => {
      this.reconciledData = data;
      this.dataSource = new MatTableDataSource(this.reconciledData);//to use material filter
      this.dataSource_2 = this.reconciledData; // to update reconciledData
      this.reconciledDataFiltered = Object.assign([], this.reconciledData);
      this.guessedType = this.guessType();
      this.reconciledData.forEach((mapping: Mapping) => {
        mapping.results = mapping.results
          .filter((result: Result) => result.types
            .filter((type: Type) => type.id === this.guessedType.id).length > 0);
      });
      this.updateThreshold();
      this.dataLoading = false;
    });
  }

  public submit() {
    const deriveMaps = [];

    if (!this.newColumnName || this.newColumnName.trim().length === 0) {
      this.newColumnName = this.header + '_' + this.selectedService;
    }

    this.newColumnName = this.newColumnName.replace(/\s/g, '_');
    deriveMaps.push(
      new DeriveMap(this.newColumnName)
        .buildFromMapping(this.reconciledData, this.threshold, [this.guessedType].filter(p => p != null)));
    this.dialogRef.close({
      'deriveMaps': deriveMaps,
      'conciliator': this.services.get(this.selectedService),
      'shift': this.shiftColumn
    });

  }

  updateServicesForSelectedGroup(): void {
    this.servicesForSelectedGroup = Array.from(this.services.values()).filter(s => s.getGroup() === this.selectedGroup);
    this.selectedService = this.servicesForSelectedGroup[0].getId();
    this.showPreview = false;
  }

  guessType(): Type {
    const cumulators = {};
    const counters = {};
    const appearances = {};
    const types = {};

    let noResultsCounter = 0;

    this.reconciledData.forEach((mapping: Mapping) => {
      if (mapping.results.length === 0) {
        noResultsCounter += 1;
      }

      mapping.results.forEach((result: Result) => {
        result.types.forEach((type: Type) => {
          if (!cumulators[type.id]) {
            cumulators[type.id] = 0;
            counters[type.id] = 0;
            appearances[type.id] = new Set();
          }
          cumulators[type.id] += result.score;
          counters[type.id] += 1;
          appearances[type.id].add(mapping.queryId);

          types[type.id] = type;
        });
      });
    });

    const scores = {};

    Object.keys(appearances).forEach((property: string) => {
      scores[property] = (cumulators[property] / counters[property]) *
        (appearances[property].size / (this.reconciledData.length - noResultsCounter));
    });

    if (Object.keys(scores).length > 0) {
      const bestTypeId = Object.keys(scores).reduce(function (a, b) { return scores[a] > scores[b] ? a : b; });
      return types[bestTypeId];
    }

    return null;
  }

  updateThreshold() {
    if (this.threshold != null) {
      if (this.threshold < 0) {
        this.threshold = 0;
      }
      if (this.threshold > 1) {
        this.threshold = 1;
      }
    } else { // when the input is not a number
      this.threshold = 0.8;
    }
    this.threshold = parseFloat(this.threshold.toFixed(2));
    this.skippedCount = 0;
    this.matchedCount = 0;
    this.maxThresholdCount = 0;
    this.notReconciledCount= 0;

    this.reconciledData.forEach((mapping: Mapping) => {
      if (mapping.results.length > 0)
      {
            if(mapping.results[0].match)
            {
              this.matchedCount += 1;
            }
            else if(!mapping.results[0].match &&  mapping.results[0].score < this.threshold)
            {
              this.skippedCount += 1;
            }
            else if(!mapping.results[0].match && mapping.results[0].score >= this.threshold)
            {
              this.maxThresholdCount += 1;
            }
      }
      else if (mapping.results.length == 0 )
      {
        this.notReconciledCount +=1;
      }
    });
  }

  set_reconciled(index, select){

    if (select != 0)
    {

      this.temp_option = this.dataSource_2[index].results[0].name;
      this.temp_score = this.dataSource_2[index].results[0].score;
      this.temp_link = this.dataSource_2[index].results[0].id;
      this.temp_match = this.dataSource_2[index].results[0].match;

      this.dataSource_2[index].results[0].name = this.dataSource_2[index].results[select].name;
      this.dataSource_2[index].results[0].score = this.dataSource_2[index].results[select].score;
      this.dataSource_2[index].results[0].id = this.dataSource_2[index].results[select].id;
      this.dataSource_2[index].results[0].match = this.dataSource_2[index].results[select].match;

      this.dataSource_2[index].results[select].name = this.temp_option;
      this.dataSource_2[index].results[select].score = this.temp_score;
      this.dataSource_2[index].results[select].id= this.temp_link;
      this.dataSource_2[index].results[select].match = this.temp_match;

      this.selected = 0;
      this.updateThreshold();
    }

  }//end set_reconcilied

  applyFilter(filterValue: string)
  {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }//end applyFilter

  hide_form()
  {
    this.form_hidden = true;
  }//end hide_form

  show_form()
  {
    this.form_hidden = false;
  }//end show_form

  openAddEntityDialog(row_index : number): void {
    const dialogRef = this.dialog.open(AddEntityDialog, {
      width: '600px',
      disableClose: true,
      data: {dialog_data : this.data_for_add_entity_dialog}

    });
    dialogRef.afterClosed().subscribe(result => {

      if(result === 0){
      }
      else
      {
        this.data_for_add_entity_dialog = result;
        while(this.dataSource_2[row_index].results.length >= 5 )
        {
          this.dataSource_2[row_index].results.splice(4, 1);
        }


        this.dataSource_2[row_index].results.push({id : this.data_for_add_entity_dialog.link, name: this.data_for_add_entity_dialog.name,
          types: null, score: this.data_for_add_entity_dialog.score, match: this.data_for_add_entity_dialog.matched});


        if(this.data_for_add_entity_dialog.set_as_reconciled)
        {
          //swap entity added position with pos 0
          this.index_added = this.dataSource_2[row_index].results.length-1;
          this.set_reconciled(row_index, this.index_added);

        }//end if set_as_reconciled true;

      }
      this.data_for_add_entity_dialog = { name: "", link : "",  score : 0, matched: false, set_as_reconciled :false};
    });//dialogRef
  }//end openAddEntityDialog

  apply_column_filter(filter : number){
    this.index_filtered_reconciled = 0;
    this.reconciledDataFiltered = Object.assign([], this.reconciledData);

    if(filter == 0)
    { // no filter
      this.dataSource = new MatTableDataSource(this.reconciledData);//to use material filter
      this.dataSource_2 = this.reconciledData; // to update reconciledData
    }
    else if(filter == 1)
    { //filter by matched
      this.reconciledData.forEach((mapping: Mapping) => {
        if ((mapping.results.length > 0 && !mapping.results[0].match) || mapping.results.length == 0)
        {
          this.reconciledDataFiltered.splice(this.index_filtered_reconciled, 1);
          this.index_filtered_reconciled--;
        }
        this.index_filtered_reconciled++;

      });
      this.dataSource = new MatTableDataSource(this.reconciledDataFiltered);//to use material filter
      this.dataSource_2 = this.reconciledDataFiltered;
    }//end filter 1
    else if(filter == 2)
    { //filter by >= threshold
      this.reconciledData.forEach((mapping: Mapping) => {
        if ((mapping.results.length > 0 && mapping.results[0].score < this.threshold) || mapping.results.length == 0)
        {
          this.reconciledDataFiltered.splice(this.index_filtered_reconciled, 1);
          this.index_filtered_reconciled--;
        }
        this.index_filtered_reconciled++;
      });
      this.dataSource = new MatTableDataSource(this.reconciledDataFiltered);//to use material filter
      this.dataSource_2 = this.reconciledDataFiltered;
    }//end filter 2
    else if(filter == 3)
    {//filter by < threshold
      this.reconciledData.forEach((mapping: Mapping) => {
        if ((mapping.results.length > 0 && mapping.results[0].score >= this.threshold) || mapping.results.length == 0)
        {
          this.reconciledDataFiltered.splice(this.index_filtered_reconciled, 1);
          this.index_filtered_reconciled--;
        }
        this.index_filtered_reconciled++;
      });
      this.dataSource = new MatTableDataSource(this.reconciledDataFiltered);//to use material filter
      this.dataSource_2 = this.reconciledDataFiltered;
    }//end filter 3
    else if(filter == 4)
    {//filter by not reconciled
      this.reconciledData.forEach((mapping: Mapping) => {
        if (mapping.results.length > 0)
        {
          this.reconciledDataFiltered.splice(this.index_filtered_reconciled, 1);
          this.index_filtered_reconciled--;
        }
        this.index_filtered_reconciled++;
      });
      this.dataSource = new MatTableDataSource(this.reconciledDataFiltered);//to use material filter
      this.dataSource_2 = this.reconciledDataFiltered;
    }//end filter 4

  }//end apply_column_filter

  sortData(sort: Sort)
  {
    const data = this.reconciledData.slice();
    if (!sort.active || sort.direction === '')
    {
      this.reconciledData = data;
      return;
    }

    this.reconciledData = data.sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        if(a.results.length > 0 && b.results.length > 0)
        {
          return this.compare(a.results[0].score, b.results[0].score, isAsc);

        }
        else if(a.results.length > 0 && b.results.length == 0)
        {

          return this.compare(a.results[0].score, 0, isAsc);

          }
        else if(a.results.length == 0 && b.results.length > 0)
        {
          return this.compare(0, b.results[0].score, isAsc);

        }

        else if(a.results.length == 0 && b.results.length == 0)
        {
          return this.compare(0, 0, isAsc);

        }

      });

      this.dataSource = new MatTableDataSource(this.reconciledData);//to use material filter
      this.dataSource_2 = this.reconciledData; // to update reconciledData
    }//end sortData

    compare(a: number | string, b: number | string, isAsc: boolean)
    {
      return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }


}//end export class

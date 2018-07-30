import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {EnrichmentService} from '../enrichment.service';
import {ConciliatorService, DeriveMap, Mapping, Result, Type} from '../enrichment.model';


@Component({
  selector: 'app-reconciliation',
  templateUrl: './reconciliation.component.html',
  styleUrls: ['./reconciliation.component.css']
})
export class ReconciliationComponent implements OnInit {

  public header: any;
  public reconciledData: any;
  public selectedGroup: any;
  public selectedService: any;
  public services: ConciliatorService[];
  public newColumnName: string;
  public validMappingsCount: number;
  public guessedType: Type;

  public showPreview: boolean;
  public reconcileButtonDisabled: boolean;

  constructor(public dialogRef: MatDialogRef<ReconciliationComponent>,
              @Inject(MAT_DIALOG_DATA) public dialogInputData: any,
              private enrichmentService: EnrichmentService) { }

  ngOnInit() {
    this.header = this.dialogInputData.header;
    this.services = [];
    this.enrichmentService.listServices().subscribe((data) => {
      Object.keys(data).forEach((serviceCategory) => {
        data[serviceCategory].forEach((service) => {
          this.services.push(new ConciliatorService(service['id'], service['name'], serviceCategory));
        });
      });
    });
    this.showPreview = false;
    this.reconcileButtonDisabled = true;
  }

  public reconcile() {
    this.enrichmentService.reconcileColumn(this.header, this.selectedService).subscribe((data) => {
      this.reconciledData = data;
      this.guessedType = this.guessType();
      this.reconciledData.forEach((mapping: Mapping) => {
        mapping.results = mapping.results
          .filter((result: Result) => result.types
            .filter((type: Type) => type.id === this.guessedType.id).length > 0);
      });
      this.validMappingsCount = this.reconciledData.filter(v => v.results.length > 0).length;
      this.showPreview = true;
      this.reconcileButtonDisabled = true;
    });
  }

  public submit() {
    const deriveMaps = [];

    if (!this.newColumnName || this.newColumnName.trim().length === 0) {
      this.newColumnName = this.header + '_' + this.selectedService;
    }

    this.newColumnName = this.newColumnName.replace(/\s/g, '_');
    deriveMaps.push(new DeriveMap(this.newColumnName).buildFromMapping(this.reconciledData));
    this.dialogRef.close({
      'deriveMaps': deriveMaps,
      'conciliator': this.services.find(conciliator => conciliator.getId() === this.selectedService)
    });

  }

  servicesByGroup(group: string): ConciliatorService[] {
    return this.services.filter(s => s.getGroup() === group );
  }

  servicesGroups(): string [] {
    return Array.from(new Set(this.services.map(s => s.getGroup())));
  }

  guessType(): Type {
    const cumulators = {};
    const counters = {};
    const appearances ={};
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
      if (appearances[property].size === this.reconciledData.length - noResultsCounter) {
        scores[property] = cumulators[property] / counters[property];
      }
    });

    const bestTypeId = Object.keys(scores).reduce(function(a, b){ return scores[a] > scores[b] ? a : b; });
    return types[bestTypeId];

  }

}

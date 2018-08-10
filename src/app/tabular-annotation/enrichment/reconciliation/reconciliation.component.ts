import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {EnrichmentService} from '../enrichment.service';
import {ConciliatorService, DeriveMap, Mapping, Result, Type} from '../enrichment.model';
import {Comparator} from 'clarity-angular';

class MappingComparator implements Comparator<Mapping> {
  compare(a: Mapping, b: Mapping) {
    const aRes = a.results;
    const bRes = b.results;

    if (aRes.length === 0 && bRes.length === 0) { // no res vs no res
      return 0;
    } else if (aRes.length === 0) { // no res vs res
      return -1;
    } else if (bRes.length === 0) { // res vs no res
      return 1;
    } else { // res vs res
      return aRes[0].score - bRes[0].score;
    }
  }
}

@Component({
  selector: 'app-reconciliation',
  templateUrl: './reconciliation.component.html',
  styleUrls: ['./reconciliation.component.css']
})
export class ReconciliationComponent implements OnInit {

  public header: any;
  public reconciledData: any;
  public selectedGroup: any;
  public selectedService: string;
  public services: Map<string, ConciliatorService>;
  public newColumnName: string;
  public validMappingsCount: number;
  public guessedType: Type;

  public showPreview: boolean;
  public dataLoading: boolean;

  public servicesGroups: string[];
  public servicesForSelectedGroup: ConciliatorService[];

  public threshold: number;
  public skippedCount: number;

  public mappingComparator = new MappingComparator();

  constructor(public dialogRef: MatDialogRef<ReconciliationComponent>,
              @Inject(MAT_DIALOG_DATA) public dialogInputData: any,
              private enrichmentService: EnrichmentService) { }

  ngOnInit() {
    this.header = this.dialogInputData.header;
    this.services = new Map();
    this.servicesGroups = [];
    this.enrichmentService.listServices().subscribe((data) => {
      Object.keys(data).forEach((serviceCategory) => {
        data[serviceCategory].forEach((service) => {
          this.services.set(service['id'], new ConciliatorService({...service, ...{'group': serviceCategory}}));
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
      this.guessedType = this.guessType();
      this.reconciledData.forEach((mapping: Mapping) => {
        mapping.results = mapping.results
          .filter((result: Result) => result.types
            .filter((type: Type) => type.id === this.guessedType.id).length > 0);
      });
      this.validMappingsCount = this.reconciledData.filter(v => v.results.length > 0).length;
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
        .buildFromMapping(this.reconciledData, this.threshold,[this.guessedType].filter(p => p != null)));
    this.dialogRef.close({
      'deriveMaps': deriveMaps,
      'conciliator': this.services.get(this.selectedService)
    });

  }

  updateServicesForSelectedGroup(): void {
    this.servicesForSelectedGroup = Array.from(this.services.values()).filter(s => s.getGroup() === this.selectedGroup );
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
      const bestTypeId = Object.keys(scores).reduce(function(a, b) { return scores[a] > scores[b] ? a : b; });
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
    this.reconciledData.forEach((mapping: Mapping) => {
      if (mapping.results.length > 0 && mapping.results[0].score < this.threshold) {
        this.skippedCount += 1;
      }
    });
  }

}

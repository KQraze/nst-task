import {
  ChangeDetectionStrategy,
  Component, model,
} from '@angular/core';
import { NgClass } from '@angular/common';

export type DateRangeMode = 'years' | 'months';

@Component({
  selector: 'date-range-switch',
  imports: [
    NgClass
  ],
  templateUrl: './date-range-switch.html',
  styleUrl: './date-range-switch.css',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class DateRangeSwitch {
  dateRangeModes: DateRangeMode[] = ['years', 'months'];

  value = model<DateRangeMode>('years');

  setDateRangeMode(mode: DateRangeMode) {
    this.value.set(mode);
  }
}


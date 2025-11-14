import {
  ChangeDetectionStrategy,
  Component,
  model
} from '@angular/core';

export type DateRangeMode = 'years' | 'months';

@Component({
  selector: 'date-range-switch',
  imports: [],
  templateUrl: './date-range-switch.html',
  styleUrl: './date-range-switch.css',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class DateRangeSwitch {
  dateRangeModes: DateRangeMode[] = ['years', 'months'];

  value = model<DateRangeMode>('months');

  setDateRangeMode(mode: DateRangeMode) {
    this.value.set(mode);
  }
}

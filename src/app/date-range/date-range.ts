import { ChangeDetectionStrategy, Component, input, model, signal } from '@angular/core';
import { DateRangeSlider } from './date-range-slider/date-range-slider';
import { DateRangeMode, DateRangeSwitch } from './date-range-switch/date-range-switch';

@Component({
  selector: 'date-range',
  imports: [DateRangeSlider, DateRangeSwitch],
  templateUrl: './date-range.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateRange {
  minDate = input(new Date(2014, 0, 1));
  endDate = input(new Date(2016, 0, 1));
  firstValue = model.required<Date>();
  secondValue = model.required<Date>();
  dateRangeMode = signal<DateRangeMode>('years');
}

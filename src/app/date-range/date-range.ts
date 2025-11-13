import {
  ChangeDetectionStrategy,
  Component, signal,
} from '@angular/core';
import { DateRangeSlider } from './date-range-slider/date-range-slider';
import {DateRangeMode, DateRangeSwitch} from './date-range-switch/date-range-switch';

@Component({
  selector: 'date-range',
  imports: [DateRangeSlider, DateRangeSwitch],
  templateUrl: './date-range.html',
  styleUrl: './date-range.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateRange {
  dateRangeMode = signal<DateRangeMode>('years');

  dateRange = signal({
    firstValue: new Date(),
    secondValue: new Date()
  });
}

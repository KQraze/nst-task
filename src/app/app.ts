import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import { DateRangeSlider } from './date-range/date-range-slider/date-range-slider';
import {DateRange} from './date-range/date-range';

@Component({
  selector: 'app-root',
  imports: [DateRange],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class App {
  readonly minDate = new Date(2014, 0, 1);
  readonly endDate = new Date(2016, 0, 1);

  dateRange = signal({
    firstValue: new Date(2014, 5, 1),
    secondValue: new Date(2014, 11, 1)
  });
}

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

}

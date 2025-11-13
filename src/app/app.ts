import { Component, signal } from '@angular/core';
import { DateRangeSlider } from './date-range/date-range-slider/date-range-slider';

@Component({
  selector: 'app-root',
  imports: [DateRangeSlider],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  dateRange = signal({
    firstValue: new Date(),
    secondValue: new Date()
  });


}

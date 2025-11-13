import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  OnDestroy,
  OnInit,
  signal,
  viewChild, viewChildren
} from '@angular/core';
import { DateRangeMode } from '../date-range-switch/date-range-switch';
import {NgClass} from '@angular/common';

type MovementCallback = (elements: {
  firstThumb: HTMLDivElement,
  secondThumb: HTMLDivElement,
  sliderTrack: HTMLDivElement,
  sliderRail: HTMLDivElement,
  firstThumbRect: DOMRect,
  secondThumbRect: DOMRect,
  sliderTrackRect: DOMRect,
  sliderRailRect: DOMRect
}) => void;

@Component({
  selector: 'date-range-slider',
  imports: [
    NgClass
  ],
  templateUrl: './date-range-slider.html',
  styleUrl: './date-range-slider.css',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class DateRangeSlider implements OnInit, OnDestroy {
  minDate = input(new Date(2014, 0, 1));
  endDate = input(new Date(2016, 0, 1));
  dateRangeMode = input<DateRangeMode>('years');
  firstValue = model<Date>()
  secondValue = model<Date>()

  firstThumb = viewChild<ElementRef<HTMLDivElement>>('firstThumb');
  secondThumb = viewChild<ElementRef<HTMLDivElement>>('secondThumb');
  sliderTrack = viewChild<ElementRef<HTMLDivElement>>('sliderTrack');
  sliderRail = viewChild<ElementRef<HTMLDivElement>>('sliderRail');
  sliderMarks = viewChildren<ElementRef<HTMLDivElement>>('sliderMark');

  activeThumb = signal<'firstThumb' | 'secondThumb' | null>(null);

  marks = computed(() => {
    const startYear = this.minDate().getFullYear();
    const endYear = this.endDate().getFullYear();

    return Array.from({ length: endYear - startYear + 1 }, (_, i) => {
      return Array.from({ length: 12 }, (_, j) => {
        const date = new Date(startYear + i, j, 1);

        return { date, month: date.getMonth(), year: date.getFullYear() };
      }).filter(({ year, month }) => !(month && year === endYear));
    }).flat();
  })

  constructor() {
    afterNextRender(() => {
      this.calcTrackPosition()
    })
  }

  onMouseMove = ({ clientX }: MouseEvent) => {
    if (!this.activeThumb()) return;

    this.moveThumb(clientX);
    this.calcTrackPosition()
  }

  onMouseUp = () => {
    this.activeThumb.set(null)
  }

  onMouseDown = (e: MouseEvent, thumb: 'firstThumb' | 'secondThumb') => {
    this.activeThumb.set(thumb)
  }

  private moveThumb = (clientX: number) => {
    this.getElements(({ firstThumb, secondThumb, sliderRailRect }) => {
      this.sliderMarks().forEach((mark, i, marks) => {

        const getSliderMarkCenter = (mark: ElementRef<HTMLDivElement>) => {
          const rect = mark.nativeElement.getBoundingClientRect();
          return rect.left + rect.width / 2;
        }

        switch (this.activeThumb()) {
          case 'firstThumb':
            if (clientX > getSliderMarkCenter(mark)) console.log(i)
            firstThumb.style.left = `${this.getPercentagePosition(clientX - firstThumb.offsetWidth / 2 - sliderRailRect.left)}%`;
            break;
          case 'secondThumb':
            secondThumb.style.left = `${this.getPercentagePosition(clientX - secondThumb.offsetWidth / 2 - sliderRailRect.left)}%`;
            break;
        }
      })
    })
  }

  private calcTrackPosition() {
    this.getElements(({ firstThumb, secondThumb, sliderRailRect, sliderTrack }) => {
      const firstThumbCenter = this.getCenterOfElement(firstThumb);
      const secondThumbCenter = this.getCenterOfElement(secondThumb);

      sliderTrack.style.left = `${this.getPercentagePosition(firstThumbCenter - sliderRailRect.left)}%`;
      sliderTrack.style.width = `${this.getPercentagePosition(secondThumbCenter - firstThumbCenter)}%`
    });
  }

  private getPercentagePosition(position: number) {
    let value: number | undefined;

    this.getElements(({ sliderRailRect }) => {
      value = (position / sliderRailRect.width) * 100;
    })

    return value;
  }

  private getCenterOfElement(element: HTMLDivElement) {
    const rect = element.getBoundingClientRect();
    return rect.left + rect.width / 2;
  }

  private getElements(callback: MovementCallback) {
    const firstThumb = this.firstThumb()?.nativeElement;
    const secondThumb = this.secondThumb()?.nativeElement;
    const sliderTrack = this.sliderTrack()?.nativeElement;
    const sliderRail = this.sliderRail()?.nativeElement;

    if (!firstThumb || !secondThumb || !sliderTrack || !sliderRail) return;

    return callback({
      firstThumb,
      secondThumb,
      sliderTrack,
      sliderRail,
      firstThumbRect: firstThumb.getBoundingClientRect(),
      secondThumbRect: secondThumb.getBoundingClientRect(),
      sliderTrackRect: sliderTrack.getBoundingClientRect(),
      sliderRailRect: sliderRail.getBoundingClientRect()
    });
  }

  getMonthShort(date: Date) {
    return new Intl.DateTimeFormat('ru', { month: 'short' }).format(date).slice(0, 3);
  }

  ngOnInit() {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('resize', () => this.calcTrackPosition());
  }

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('resize', () => this.calcTrackPosition());
  }
}


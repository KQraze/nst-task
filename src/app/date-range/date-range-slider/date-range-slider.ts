import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  model,
  OnDestroy,
  OnInit,
  signal,
  viewChild
} from '@angular/core';
import { DateRangeMode } from '../date-range-switch/date-range-switch';

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
  imports: [],
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

  sliderTrack = viewChild<ElementRef<HTMLDivElement>>('sliderTrack');
  firstThumb = viewChild<ElementRef<HTMLDivElement>>('firstThumb');
  secondThumb = viewChild<ElementRef<HTMLDivElement>>('secondThumb');
  sliderRail = viewChild<ElementRef<HTMLDivElement>>('sliderRail');

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
    effect(() => {
      this.calcTrackPosition()
    })
  }

  onMouseMove = ({ clientX }: MouseEvent) => {
    if (!this.activeThumb()) return;

    this.moveThumb(this.activeThumb()!, clientX);
    this.calcTrackPosition()
  }

  onMouseUp = () => {
    this.activeThumb.set(null)
  }

  onMouseDown = (e: MouseEvent, thumb: 'firstThumb' | 'secondThumb') => {
    this.activeThumb.set(thumb)
  }

  private moveThumb = (thumb: 'firstThumb' | 'secondThumb', clientX: number) => {
    this.getElements(({ firstThumb, firstThumbRect, secondThumb, secondThumbRect, sliderRailRect }) => {
      switch (thumb) {
        case 'firstThumb':
          // if (clientX - firstThumb.offsetWidth / 2 > secondThumbRect.left || sliderRailRect.left >= clientX - firstThumb.offsetWidth / 2) return;
          if (clientX - firstThumb.offsetWidth / 2 > secondThumbRect.left) return;

          firstThumb.style.left = `${this.getPercentagePosition(clientX - firstThumb.offsetWidth / 2 - sliderRailRect.left)}%`;
          break;
        case 'secondThumb':
          // if (clientX + firstThumb.offsetWidth / 2 < firstThumbRect.right || sliderRailRect.right <= clientX + secondThumb.offsetWidth / 2) return;
          if (clientX + firstThumb.offsetWidth / 2 < firstThumbRect.right) return;

          secondThumb.style.left = `${this.getPercentagePosition(clientX - secondThumb.offsetWidth / 2 - sliderRailRect.left)}%`;
          break;
      }
    })
  }

  private calcTrackPosition() {
    this.getElements(({ firstThumbRect, secondThumbRect, sliderRailRect, sliderTrack }) => {
      const firstThumbCenter = firstThumbRect.left + firstThumbRect.width / 2;
      const secondThumbCenter = secondThumbRect.left + secondThumbRect.width / 2;

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


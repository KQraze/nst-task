import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed, effect,
  ElementRef,
  input,
  model,
  OnDestroy,
  OnInit,
  signal,
  viewChild, viewChildren
} from '@angular/core';
import { DateRangeMode } from '../date-range-switch/date-range-switch';
import { NgClass, TitleCasePipe } from '@angular/common';

type CallbackWithElements = (elements: {
  firstThumb: HTMLDivElement,
  secondThumb: HTMLDivElement,
  sliderTrack: HTMLDivElement,
  sliderRail: HTMLDivElement,
  firstThumbRect: DOMRect,
  secondThumbRect: DOMRect,
  sliderTrackRect: DOMRect,
  sliderRailRect: DOMRect
}) => void;

type ThumbType = 'firstThumb' | 'secondThumb';

@Component({
  selector: 'date-range-slider',
  imports: [
    NgClass,
    TitleCasePipe
  ],
  templateUrl: './date-range-slider.html',
  styleUrl: './date-range-slider.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateRangeSlider implements OnInit, OnDestroy {
  minDate = input(new Date(2014, 0, 1));
  endDate = input(new Date(2016, 0, 1));
  dateRangeMode = input<DateRangeMode>('years');
  firstValue = model.required<Date>()
  secondValue = model.required<Date>()

  firstThumb = viewChild<ElementRef<HTMLDivElement>>('firstThumb');
  secondThumb = viewChild<ElementRef<HTMLDivElement>>('secondThumb');
  sliderTrack = viewChild<ElementRef<HTMLDivElement>>('sliderTrack');
  sliderRail = viewChild<ElementRef<HTMLDivElement>>('sliderRail');
  sliderMarks = viewChildren<ElementRef<HTMLDivElement>>('sliderMark');

  activeThumb = signal<ThumbType | null>(null);

  marks = computed(() => {
    const startYear = this.minDate().getFullYear();
    const endYear = this.endDate().getFullYear();

    return Array.from({ length: endYear - startYear + 1 }, (_, i) => {
      return Array.from({ length: 12 }, (_, j) => {
        const date = new Date(startYear + i, j, 1);

        return { date, month: date.getMonth(), year: date.getFullYear() };
      }).filter(({ year, month }) => !(month && year === endYear));
    }).flat();
  });

  private thumbPositionGetter = (type: 'firstValue' | 'secondValue') => {
    return () => {
      const index = this.marks().findIndex((mark) => {
        return this[type]().getFullYear() === mark.year && this[type]().getMonth() === mark.month;
      })

      return index !== -1 ? index : 0;
    }
  }

  firstThumbPosition = computed(this.thumbPositionGetter('firstValue'));
  secondThumbPosition = computed(this.thumbPositionGetter('secondValue'))

  constructor() {
    afterNextRender(() => {
      this.calcAllPositions()
    })

    effect(() => {
      console.log(this.dateRangeMode());
    });
  }

  onMouseMove = ({ clientX }: MouseEvent) => {
    if (!this.activeThumb()) return;

    this.moveThumbByClient(clientX);
    this.calcTrackPosition()
  }

  onMouseUp = () => {
    this.activeThumb.set(null)
    this.calcAllPositions()
  }

  onMouseDown = (e: MouseEvent, thumb: ThumbType) => {
    this.activeThumb.set(thumb)
  }

  private moveThumbByClient = (clientX: number) => {
    this.getElements(({ firstThumb, secondThumb, firstThumbRect, secondThumbRect, sliderRailRect }) => {
      switch (this.activeThumb()) {
        case 'firstThumb':
          if (clientX - firstThumb.offsetWidth / 2 > secondThumbRect.left || sliderRailRect.left >= clientX - firstThumb.offsetWidth / 2) return;
          firstThumb.style.left = this.getPercentagePositionOfRail(clientX - firstThumb.offsetWidth / 2);

          this.thumbIntersectingCallback('firstThumb', (_, index) => {
            if (this.firstThumbPosition() !== index) this.firstValue.set(this.marks()[index].date);
          })
          break;
        case 'secondThumb':
          if (clientX + firstThumb.offsetWidth / 2 < firstThumbRect.right || sliderRailRect.right <= clientX + secondThumb.offsetWidth / 2) return;
          secondThumb.style.left = this.getPercentagePositionOfRail(clientX - secondThumb.offsetWidth / 2);

          this.thumbIntersectingCallback('secondThumb', (_, index) => {
            if (this.secondThumbPosition() !== index) this.secondValue.set(this.marks()[index].date);
          })
          break;
      }
    })
  }

  private calcTrackPosition() {
    this.getElements(({ firstThumb, secondThumb, sliderTrack }) => {
      const firstThumbCenter = this.getCenter(firstThumb);
      const secondThumbCenter = this.getCenter(secondThumb);

      sliderTrack.style.left = this.getPercentagePositionOfRail(firstThumbCenter);
      sliderTrack.style.width = `${this.getPercentagePosition(secondThumbCenter - firstThumbCenter)}%`
    });
  }

  private calcThumbPosition = (thumb: ThumbType) => {
    this.getElements(({ firstThumb, secondThumb }) => {
      switch (thumb) {
        case 'firstThumb':
          firstThumb.style.left = this.getPercentagePositionOfRail(this.getCenter(this.sliderMarks()[this.firstThumbPosition()].nativeElement) - firstThumb.offsetWidth / 2)
          break;
        case 'secondThumb':
          secondThumb.style.left = this.getPercentagePositionOfRail(this.getCenter(this.sliderMarks()[this.secondThumbPosition()].nativeElement) - secondThumb.offsetWidth / 2)
          break;
      }
    })
  }

  private calcAllPositions() {
    this.calcThumbPosition('firstThumb')
    this.calcThumbPosition('secondThumb')
    this.calcTrackPosition()
  }

  private getPercentagePositionOfRail(position: number) {
    let value: number | undefined;

    this.getElements(({ sliderRailRect }) => {
      value = this.getPercentagePosition(position - sliderRailRect.left)
    })

    return `${value}%`;
  }

  private getPercentagePosition(position: number) {
    let value: number | undefined;

    this.getElements(({ sliderRailRect }) => {
      value = (position / sliderRailRect.width) * 100;
    })

    return value;
  }

  private getCenter(element: HTMLDivElement) {
    const rect = element.getBoundingClientRect();
    return rect.left + rect.width / 2;
  }

  private thumbIntersectingCallback(thumb: ThumbType, callback?: (mark: HTMLDivElement, i: number) => void) {
    this.getElements(({ firstThumbRect, secondThumbRect }) => {
      const currentThumbRect = thumb === 'firstThumb' ? firstThumbRect : secondThumbRect;

      this.sliderMarks().forEach((mark, i) => {
        const markCenter = this.getCenter(mark.nativeElement)
        if (currentThumbRect.left <= markCenter && currentThumbRect.right >= markCenter) callback?.(mark.nativeElement, i);
      })
    })
  }

  private getElements(callback: CallbackWithElements) {
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

  getMonthLong(date: Date) {
    return new Intl.DateTimeFormat('ru', { month: 'long' }).format(date);
  }


  ngOnInit() {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('resize', () => this.calcAllPositions());
  }

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('resize', () => this.calcAllPositions());
  }
}


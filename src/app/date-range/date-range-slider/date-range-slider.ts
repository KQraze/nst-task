import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  signal,
  untracked,
  viewChild,
  viewChildren
} from '@angular/core';
import { DateRangeMode } from '../date-range-switch/date-range-switch';
import { TitleCasePipe } from '@angular/common';

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
    TitleCasePipe
  ],
  templateUrl: './date-range-slider.html',
  styleUrl: './date-range-slider.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onMouseMove($event)',
    '(document:mouseup)': 'onMouseUp()',
    '(window:resize)': 'calcAllPositions()'
  }
})
export class DateRangeSlider {
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
    const start = this.minDate();
    const end = this.endDate();
    const marks: { date: Date; month: number; year: number }[] = [];

    for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
      const minMonth = year === start.getFullYear() ? start.getMonth() : 0;
      const maxMonth = year === end.getFullYear() ? end.getMonth() : 11;

      for (let month = minMonth; month <= maxMonth; month++) {
        marks.push({ date: new Date(year, month, 1), month, year });
      }
    }

    return marks;
  });

  firstThumbPosition = computed(() => this.getThumbPosition(this.firstValue()));
  secondThumbPosition = computed(() => this.getThumbPosition(this.secondValue()));

  constructor() {
    afterRenderEffect(() => {
      this.dateRangeMode();

      untracked(() => {
        this.calcAllPositions();
      });
    })
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

  onMouseDown = (thumb: ThumbType) => {
    this.activeThumb.set(thumb)
  }

  calcAllPositions() {
    this.calcThumbPosition('firstThumb')
    this.calcThumbPosition('secondThumb')
    this.calcTrackPosition()
  }

  getMonthShort = (date: Date) => this.formatMonth(date, 'short');
  getMonthLong = (date: Date) => this.formatMonth(date, 'long');

  private getThumbPosition(value: Date): number {
    const index = this.marks().findIndex(mark =>
      value.getFullYear() === mark.year && value.getMonth() === mark.month
    );
    return index !== -1 ? index : 0;
  }

  private moveThumbByClient = (clientX: number) => {
    this.getElements(({ firstThumb, secondThumb, firstThumbRect, secondThumbRect, sliderRailRect }) => {
      const halfThumbWidth = firstThumbRect.width / 2;
      const newPosition = clientX - halfThumbWidth;

      if (this.activeThumb() === 'firstThumb') {
        if (newPosition > secondThumbRect.left || sliderRailRect.left >= newPosition) return;
        firstThumb.style.left = this.getPercentagePositionOfRail(newPosition);

        this.updateThumbValue('firstThumb')
        return;
      }

      if (clientX + halfThumbWidth < firstThumbRect.right || sliderRailRect.right <= clientX + halfThumbWidth) return;
      secondThumb.style.left = this.getPercentagePositionOfRail(newPosition);

      this.updateThumbValue('secondThumb')
    })
  }

  private updateThumbValue = (thumb: ThumbType) => {
    this.thumbIntersectingCallback(thumb, (index) => {
      if (![this.firstThumbPosition(), this.secondThumbPosition()].includes(index)) {
        const currentThumb = thumb === 'firstThumb' ? this.firstValue : this.secondValue;
        currentThumb.set(this.marks()[index].date)
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
      const isFirst = thumb === 'firstThumb';
      const thumbElement = isFirst ? firstThumb : secondThumb;
      const position = isFirst ? this.firstThumbPosition() : this.secondThumbPosition();
      const marks = this.sliderMarks();

      const isEdgeMark = isFirst ? position === 0 : position === this.marks().length - 1;

      if (isEdgeMark) {
        const markIndex = isFirst ? 0 : marks.length - 1;
        const markRect = marks[markIndex].nativeElement.getBoundingClientRect();
        const leftPosition = isFirst ? markRect.left : markRect.right - thumbElement.offsetWidth;
        thumbElement.style.left = this.getPercentagePositionOfRail(leftPosition);
        return;
      }

      const markCenter = this.getCenter(marks[position].nativeElement);
      thumbElement.style.left = this.getPercentagePositionOfRail(markCenter - thumbElement.offsetWidth / 2);
    });
  };

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

  private thumbIntersectingCallback(thumb: ThumbType, callback?: (i: number) => void) {
    this.getElements(({ firstThumbRect, secondThumbRect }) => {
      const currentThumbRect = thumb === 'firstThumb' ? firstThumbRect : secondThumbRect;

      this.sliderMarks().forEach((mark, i) => {
        const markCenter = this.getCenter(mark.nativeElement)
        if (currentThumbRect.left <= markCenter && currentThumbRect.right >= markCenter) callback?.(i);
      })
    })
  }

  private getElements(callback: CallbackWithElements) {
    return untracked(() => {
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
    })
  }

  private formatMonth(date: Date, style: 'short' | 'long'): string {
    const formatted = new Intl.DateTimeFormat('ru', { month: style }).format(date);
    return style === 'short' ? formatted.slice(0, 3) : formatted;
  }
}


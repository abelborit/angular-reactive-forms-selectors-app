import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-selector-page',
  templateUrl: './selector-page.component.html',
  styles: [],
})
export class SelectorPageComponent {
  constructor(private formBuilder: FormBuilder) {}

  public myForm: FormGroup = this.formBuilder.nonNullable.group({
    region: ['', Validators.required],
    country: ['', Validators.required],
    borders: ['', Validators.required], // fronteras con los cuales cada país limita
  });
}
